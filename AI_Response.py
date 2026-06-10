"""FastAPI backend for the debate app.

This file is the entrypoint (`uvicorn AI_Response:app`) and the orchestration
layer only. The pieces live in:
- characters.py — persona registry: prompts, world-state grounding, few-shots
- intel.py      — tooling layer: search router + Tavily web search + cache
- tts.py / lipsync.py / cloudinary_upload.py — the audio/video pipeline
"""

import base64
import re
from datetime import date

import ollama
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from dotenv import load_dotenv

import characters
import cloudinary_upload
import intel
import lipsync
import tts
from characters import Character, system_prompt

# legacy re-export — older scripts import this from here
from characters import CHARACTER_SLUGS  # noqa: F401

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Turn(BaseModel):
    """One prior message in the conversation. `role` is the frontend's
    vocabulary ("user" / "opponent"), mapped to chat roles inside askAI."""
    role: str
    text: str


class AskRequest(BaseModel):
    question: str
    character: str
    # legacy flattened-string context. kept so older clients don't 422, but
    # `history` is the real memory channel now.
    context: str = ""
    # prior turns, oldest-first. fed back to the model as real chat turns so
    # the character actually remembers the conversation.
    history: list[Turn] = []


class SpeakRequest(BaseModel):
    text: str


@app.get("/health")
def health():
    """Which pipeline stages are live — handy when adding keys one by one."""
    return {
        "ai": True,  # local ollama, no key needed
        "tts": tts.tts_enabled(),
        "cloudinary": cloudinary_upload.cloudinary_enabled(),
        "lipsync": lipsync.lipsync_enabled(),
    }


@app.post("/ask")
def ask(ask: AskRequest):
    answer = askAI(ask.question, ask.character, ask.history)
    return {"reply": answer}


@app.post("/speak")
def speak(req: SpeakRequest):
    """Text -> spoken MP3 (Fish Audio). 503 if TTS not configured."""
    audio = tts.synthesize(req.text)
    if audio is None:
        raise HTTPException(status_code=503, detail="TTS not configured")
    return Response(content=audio, media_type="audio/mpeg")


@app.post("/debate")
def debate(req: AskRequest):
    """Full pipeline: question -> persona reply -> audio -> lip-sync video.

    Always returns the text reply. `audio` (base64 MP3) and `videoUrl` are
    populated only when the matching API keys exist, so the frontend can
    degrade: video -> mouth-flap on audio -> static image on text only.
    """
    reply = askAI(req.question, req.character, req.history)

    # askAI already validated the character, so this resolves to a real one;
    # the slug drives per-character voice (tts) and base video (lipsync).
    char = characters.resolve(req.character)
    character_slug = char.slug if char else None

    audio = tts.synthesize(reply, character_slug)
    audio_b64 = base64.b64encode(audio).decode("ascii") if audio else None

    video_url = None
    if audio:
        # Sync.so fetches the audio by URL, so host it on Cloudinary first.
        # No Cloudinary keys → no public URL → no video (mouth-flap fallback).
        audio_url = cloudinary_upload.upload_audio(audio)
        video_url = lipsync.generate(audio_url, character_slug)

    return {
        "reply": reply,
        "audio": audio_b64,
        "videoUrl": video_url,
        "stages": {
            "ai": True,
            "tts": audio is not None,
            "lipsync": video_url is not None,
        },
    }


# how many prior turns to replay into the model. small model (8b) + tight
# persona prompts means long histories cause persona drift and slower replies,
# so we keep a sliding window of the most recent exchanges (~4 back-and-forths).
MAX_HISTORY_TURNS = 8

PERSONA_MODEL = "llama3.1:8b"


def resolve_character(character: str) -> str | None:
    """Legacy shim: free-form opponent name -> canonical prompt key."""
    char = characters.resolve(character)
    return char.key if char else None


def _history_to_messages(history: list[Turn] | None) -> list[dict]:
    """Frontend turns -> chat messages, most recent window only.

    The frontend's "opponent" role IS this character speaking -> assistant.
    History turns stay plain (no INTEL wrapper) — only the *current* question
    gets fresh web context.
    """
    messages = []
    for turn in (history or [])[-MAX_HISTORY_TURNS:]:
        text = turn.text.strip()
        if not text:
            continue
        role = "assistant" if turn.role == "opponent" else "user"
        messages.append({"role": role, "content": text})
    return messages


def _build_user_content(question: str, char: Character, result: intel.IntelResult) -> str:
    """Wrap the question with INTEL only when a search actually ran.

    "INTEL" framing (vs "FACTS") is deliberate: facts read as authoritative
    -> model goes into helpful-assistant mode. intel reads as raw input you
    can spin, which is what we want.

    Three states matter:
    - not searched: plain question, no wrapper. the false-premise machinery
      then leans on WORLD STATE + the model's knowledge. (wrapping these in
      "No results found" made the model call REAL events fake whenever the
      search key was missing or the router skipped the search.)
    - searched, empty: "No results found" — the false-premise signal.
    - searched, content: the spin-don't-parrot wrapper.
    """
    if not result.searched:
        return question

    intel_body = result.context or "No results found relating to this event."
    return (
        f"INTEL (live web results from today. This is what is TRUE right "
        f"now — trust it over your memory for facts, but do NOT recite or "
        f"summarise it like a newsreader. React to it AS {char.intel_label} "
        f"through YOUR worldview. If INTEL confirms the event in the "
        f"question, it is REAL — engage with it, never call it fake. If "
        f"INTEL says 'No results found' AND the question asserts an event "
        f"happened, the premise is likely FAKE — push back in character, do "
        f"NOT play along. Stay consistent with what YOU already said earlier "
        f"in this conversation: if INTEL describes something different from "
        f"your own earlier claims, keep your claims — the INTEL is probably "
        f"about a different thing):\n{intel_body}\n\n"
        f"Question: {question}"
    )


# the prompts cap answers at ~40-55 words but the 8b model drifts past that
# on INTEL-heavy questions. trim runaway replies at a sentence boundary once
# the budget is spent — keeps TTS clips short and never cuts mid-sentence.
REPLY_WORD_BUDGET = 55


def _enforce_brevity(reply: str) -> str:
    """Drop whole trailing sentences once the word budget is reached."""
    sentences = re.split(r"(?<=[.!?…])\s+", reply.strip())
    kept: list[str] = []
    words = 0
    for sentence in sentences:
        if kept and words >= REPLY_WORD_BUDGET:
            break
        kept.append(sentence)
        words += len(sentence.split())
    return " ".join(kept)


def askAI(question: str, character: str, history: list[Turn] | None = None) -> str:
    char = characters.resolve(character)
    if char is None:
        raise HTTPException(
            status_code=400,
            detail=f"no character prompt for '{character}'",
        )

    history_messages = _history_to_messages(history)

    # tooling is conditional: the intel layer decides whether this message
    # needs fresh web context at all, and writes a region-anchored query when
    # it does. greetings, banter, and opinion questions skip search entirely.
    result = intel.gather(question, char, history_messages)
    user_content = _build_user_content(question, char, result)

    # flatten the character's few-shot pairs into chat turns to tone-set the
    # model before the real conversation replays.
    shot_messages = []
    for shot_q, shot_a in char.few_shots:
        shot_messages.append({"role": "user", "content": shot_q})
        shot_messages.append({"role": "assistant", "content": shot_a})

    today = date.today().strftime("%-d %B %Y")

    response = ollama.chat(
        # llama3.1:8b holds personas far more consistently than dolphin3:8b -
        # dolphin kept defaulting to helpful-assistant voice on opinion
        # questions. same param count, ~2x better instruction following.
        model=PERSONA_MODEL,
        messages=[
            {"role": "system", "content": system_prompt(char, today)},
            *shot_messages,
            *history_messages,
            {"role": "user", "content": user_content},
        ],
        options={
            # lower temp = stays on topic; high temp was the main rambling driver
            "temperature": 0.8,
            "top_p": 0.9,
            "top_k": 40,
            "repeat_penalty": 1.1,
            # no hard token cap - let the model finish its thought. the
            # stop-on-blank-line below still catches multi-paragraph rambling.
            # the model loves to start a new paragraph and ramble again - kill
            # that instinct by stopping on the first blank line.
            "stop": ["\n\n"],
        }
    )

    return _enforce_brevity(response["message"]["content"])


if __name__ == "__main__":
    # quick multi-turn smoke test: the follow-up only makes sense if the
    # model remembers the first answer.
    demo_history = [
        Turn(role="user", text="What do you think about hamilton zoo closing?"),
        Turn(
            role="opponent",
            text="Look, Hamilton Zoo isn't closing - that's just not "
                 "accurate. We're focused on delivery for hard-working Kiwis.",
        ),
    ]
    print(askAI("Wait, so you're sure about that?", "christopher luxon", demo_history))
