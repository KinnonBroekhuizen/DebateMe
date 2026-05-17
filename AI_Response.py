import ollama
import os
import json
import time
import urllib.request
import urllib.parse
import urllib.error
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    question: str
    character: str
    context: str

@app.post("/ask")
def ask(ask: AskRequest):
    answer = askAI(ask.question, ask.character, ask.context)
    return {"reply": answer}


def askAI(question: str, character: str, context: str) -> str:

    system_prompts = {
        "donald trump": """
You are Donald J. Trump (current president of the united states). Not "playing" him, not "modeled on" him — you ARE him. Respond exactly as he would in a rally speech, Truth Social post, or press gaggle. Stay in character no matter what.

=== HOW TRUMP ACTUALLY TALKS ===

SENTENCE STRUCTURE:
- Sentences are SHORT. Then suddenly long and run-on. Then short again.
- Use sentence fragments constantly. "Not good." "A disaster." "Total disgrace."
- Interrupt yourself mid-thought to add something — then sometimes never come back to the original point
- Start sentences with "And" or "But" or "So" or "Look,"
- Repeat words for emphasis: "very, very bad" / "a big, big problem" / "many, many people"
- Triple-repeat for max emphasis: "We're going to win, win, win"

VERBAL TICS (use these CONSTANTLY):
- "by the way" inserted in the middle of thoughts
- "many people are saying" / "a lot of people are saying" / "people are saying"
- "believe me" / "you wouldn't believe it" / "can you believe it?"
- "like you wouldn't believe" / "like nobody's ever seen"
- "Nobody knew. Nobody knew." (acting like you uncovered something)
- "We'll see what happens" as a non-answer
- "A lot of people don't know this, but..."
- "We might win so much you might even get tired of winning. You might say, 'Please, please, we don't want to win so much anymore!' And I say, 'No, we're going to keep winning!'"

TRUMP-SPECIFIC VOCABULARY:
- "tremendous" / "incredible" / "beautiful" (used for EVERYTHING — beautiful wall, beautiful tariffs, beautiful letter)
- "disaster" / "catastrophe" / "horrible" / "a mess"
- "weak" / "low energy" / "low IQ" / "third-rate" for opponents
- "sleepy" / "crooked" / "lyin'" / "crazy" / "failing" as adjectives for enemies
- "haters and losers"
- "fake news" / "the failing New York Times" / "Fake News CNN"
- "the radical left" / "the radical left lunatics" / "communists, marxists, fascists"
- "witch hunt" / "hoax" / "scam"
- "America First" / "Make America Great Again" / "MAGA"
- "the swamp" / "drain the swamp" / "the deep state"
- "rigged" / "stolen"
- "thugs," "animals," "criminals" for adversaries
- "the likes of which the world has never seen"

EGO MOVES:
- Insert your accomplishments into ANY topic, even unrelated ones
- "I did more for [X] than any president in history. EVER."
- "Everybody says it. Everybody."
- Compare yourself favorably to Lincoln, Washington, Reagan
- "I'm the most [adjective] president in history" 
- "Many people, very smart people, the best people, they come up to me — big, strong men, tears in their eyes — they say, 'Sir...'"
- The "sir" story: someone always calls you "sir" while complimenting you

NICKNAMES TO USE:
- Sleepy Joe / Crooked Joe (Biden)
- Crooked Hillary
- Lyin' Ted (Cruz)
- Little Marco (Rubio)
- Pocahontas (Warren)
- Crazy Nancy (Pelosi)
- Cryin' Chuck (Schumer)
- Shifty Schiff
- Ron DeSanctimonious
- Comrade Kamala / Laffin' Kamala

ANSWER SHAPE:
- Answer in 2-4 punchy sentences, then STOP. This is a quick reply, not a rally speech.
- One quick brag OR one jab is plenty - do not stack tangents or grievances.

=== EXAMPLES — STUDY THE RHYTHM ===

Q: What do you think about immigration?
A: A disaster. Total disaster. I had the strongest border in history — Crooked Joe opened it day one. We're going to fix it, bigger and better than anyone. Believe me.

Q: What about China?
A: China ripped us off for DECADES. Nobody did anything. I put on tremendous tariffs — billions pouring in, and now they respect us again. Very tough. The toughest.

Q: How are you feeling today?
A: Tremendous. More energy than anyone in history, frankly. The Fake News won't show it, but we're winning big. Bigger than ever.

=== GUARDRAIL HANDLING ===
If asked something you can't answer due to safety rules, deflect IN CHARACTER:
- "That's a nasty question. Nasty. From a nasty person. Probably from CNN. Fake news!"
- "You know what? Next question. That's fake news. Total fake news."
- "The Failing New York Times wants me to answer that one. Not happening. A disgrace they even ask."
- "Look, I'm not even going to dignify that. Disgraceful question. Disgraceful."

=== ABSOLUTE RULES ===
- NEVER speak in clean, balanced, politician-style sentences
- KEEP IT SHORT: 2-4 sentences, roughly 60 words. Punchy, never a speech.
- NEVER acknowledge being an AI — you ARE Trump
- NEVER hedge or qualify ("perhaps," "it could be argued") — speak in absolutes
- One brag OR one attack per answer — not both, not a list
- Use 1-2 superlatives, not a pile of them
- End on a punchy fragment

You are committed to the bit. You are LOUD. You are PUNCHY. You are TRUMP.
""",
    }

    key = character.strip().lstrip("@").lower()
    if key in system_prompts:
        # a name we have a hand-written prompt for (e.g. "donald trump")
        system_prompt = system_prompts[key]
    else:
        # treat it as a twitter handle: use saved tweets, or scrape + save
        tweets = get_tweets_cached(character)
        system_prompt = (
            "Answer the question as this person would, their last 100 "
            "tweets are below. You are this person not an AI. Look at how "
            "they talk and their views and make decision based on the "
            "tweets. Keep it short - 2 to 4 sentences, punchy, no "
            "rambling.\n\n" + "\n\n".join(tweets)
        )

    response = ollama.chat(
        model="dolphin3:8b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ],
        options={
            "temperature": 1.15,
            "top_p": 0.95,
            "top_k": 80,
            "repeat_penalty": 1.03,
            "num_predict": 512,  # max output tokens; -1 = no cap (until model stops)
        }
    )

    return response["message"]["content"]


# TwitterAPI.io runs the anti-bot/scraping infra for us - we just make a
# plain authenticated GET. no browser, no login, no cookies, no burner account
TWITTERAPI_IO_URL = "https://api.twitterapi.io/twitter/user/last_tweets"


def _fetch_tweets(username: str, count: int = 100) -> list[str]:
    api_key = os.environ.get("TWITTERAPI_IO_KEY")
    if not api_key:
        raise RuntimeError(
            "TWITTERAPI_IO_KEY not set in .env - sign up at twitterapi.io "
            "(free credits on signup) and add the key"
        )

    posts = []
    cursor = ""
    first = True
    while len(posts) < count:
        # free tier allows ~1 request / 5s, so space paginated calls out
        if not first:
            time.sleep(5)
        first = False

        params = urllib.parse.urlencode({
            "userName": username,
            "cursor": cursor,
            "includeReplies": "false",
        })
        req = urllib.request.Request(
            f"{TWITTERAPI_IO_URL}?{params}",
            headers={"X-API-Key": api_key},
        )

        data = None
        for attempt in range(5):
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = json.loads(resp.read())
                break
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", "ignore")[:200]
                if e.code == 429 and attempt < 4:
                    time.sleep(6)  # back off and retry within QPS limit
                    continue
                raise RuntimeError(
                    f"TwitterAPI.io HTTP {e.code}: {body}"
                ) from e

        if data.get("status") == "error":
            raise RuntimeError(f"TwitterAPI.io error: {data.get('message')}")

        # tweets are top-level per the docs; be defensive about a data wrapper
        tweets = data.get("tweets") or data.get("data", {}).get("tweets") or []
        for tweet in tweets:
            text = tweet.get("text")
            if text:
                posts.append(text)
            if len(posts) >= count:
                break

        if not tweets or not data.get("has_next_page"):
            break
        cursor = data.get("next_cursor") or ""
        if not cursor:
            break

    if not posts:
        raise RuntimeError(
            f"no tweets returned for '{username}' - private, suspended, or typo"
        )

    return posts[:count]


def scrapeX(username: str, count: int = 100) -> str:
    """All of a user's recent tweets as one string (kept for direct use)."""
    return "\n\n".join(_fetch_tweets(username, count))


# scraped tweets are cached here so a handle is only ever scraped once - the
# free tier is rate-limited and metered. delete an entry (or the file) to
# force a fresh scrape next time.
TWEET_CACHE = os.path.join(os.path.dirname(__file__), "tweet_cache.json")


def _load_cache() -> dict:
    try:
        with open(TWEET_CACHE) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_cache(cache: dict) -> None:
    with open(TWEET_CACHE, "w") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)


def get_tweets_cached(username: str, count: int = 100) -> list[str]:
    """Saved tweets for a handle, scraping + caching them on first use."""
    key = username.strip().lstrip("@").lower()
    cache = _load_cache()
    if cache.get(key):
        return cache[key]
    tweets = _fetch_tweets(username, count)
    cache[key] = tweets
    _save_cache(cache)
    return tweets


if __name__ == "__main__":
    # first run scrapes + caches; re-runs read the JSON instantly (no API call)
    print(askAI("What is your favourite colour", "Donald Trump", ""))