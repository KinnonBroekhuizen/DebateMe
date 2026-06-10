"""Intel layer: decides WHETHER a message needs live web context, writes the
search query, and runs the (cached) Tavily search.

Pipeline per message:
1. Smalltalk fast path — greetings/filler never search and never get an
   INTEL wrapper (searching "hi" returns dictionary junk the model parrots).
2. LLM router — a single low-temperature JSON call to the already-loaded
   local model decides `needs_search` and, when true, rewrites the message
   into ONE self-contained query anchored to the character's region. This is
   what stops "what do you think about immigration?" asked to a New Zealand
   politician from pulling US-centric results.
3. Tavily search with a short-TTL file cache.

The result distinguishes three states the prompt machinery cares about:
- not searched (no INTEL wrapper at all — search wasn't needed or possible)
- searched, found nothing (the false-premise signal: "No results found")
- searched, found context
"""

import json
import os
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import date

import ollama

from characters import Character

# same model the personas use, so it's already resident in ollama and the
# router call costs one short generation, not a model load.
ROUTER_MODEL = "llama3.1:8b"
ROUTER_NUM_PREDICT = 120

TAVILY_URL = "https://api.tavily.com/search"
WEB_CACHE = os.path.join(os.path.dirname(__file__), "web_cache.json")
# short TTL: "current issues" go stale within hours, not days
WEB_CACHE_TTL_SECONDS = 60 * 60  # 1 hour
# cap injected context so a rich Tavily response can't drown an 8b model's
# persona prompt
MAX_INTEL_CHARS = 1500
# how many history turns the router sees for pronoun resolution
ROUTER_HISTORY_TURNS = 4


@dataclass(frozen=True)
class IntelResult:
    """Outcome of the intel pipeline for one message."""
    searched: bool  # a web search actually ran (not skipped/unavailable/errored)
    context: str    # "" when nothing found or not searched


NO_INTEL = IntelResult(searched=False, context="")


# trivial conversational filler — greetings, thanks, acknowledgements. these
# don't assert events and don't need fresh web context, so they skip the
# router call entirely.
_SMALLTALK = {
    "hi", "hii", "hiya", "hey", "heya", "hello", "helo", "yo", "sup",
    "wassup", "whatsup", "howdy", "gday", "g day", "kia ora", "hola",
    "hi there", "hey there", "hello there",
    "good morning", "good afternoon", "good evening", "morning", "evening",
    "how are you", "how are ya", "how r u", "how you doing", "how are you doing",
    "hows it going", "how is it going", "what's up", "whats up",
    "you good", "you alright", "you ok",
    "thanks", "thank you", "thx", "ta", "cheers", "ok", "okay", "k", "cool",
    "nice", "lol", "haha", "lmao", "bye", "goodbye", "see ya", "cya",
    "good", "great", "test", "testing",
}


def is_smalltalk(question: str) -> bool:
    """True for greetings / filler that shouldn't trigger web search."""
    normalized = "".join(
        c for c in question.strip().lower() if c.isalnum() or c.isspace()
    )
    normalized = " ".join(normalized.split())
    return normalized in _SMALLTALK


# ── router ───────────────────────────────────────────────────────────────────

_ROUTER_PROMPT = """You are the search router for a political debate game.
Today's date is {today}.
The player is debating {identity}

Decide if answering the player's LATEST message well requires a live web
search for current real-world information.

search = true when the message:
- asserts or asks about any real-world event, decision, scandal, or change
  ("now that...", "since...", "what about the new...")
- asks about news, policies, positions, legislation, prices, statistics,
  polls, or any fact that changes over time
- asks for their view on a policy area or political topic (immigration, the
  economy, health, crime, housing, tax...) — answering well needs the current
  facts on that topic
- names real people, places, organisations, or bills

search = false when the message is:
- a greeting, thanks, or small talk
- banter, insults, or a personal question about the politician themselves
  (favourite food, feelings, family, hobbies, how they'd describe themselves)
- a pure hypothetical or philosophical question with no real-world facts
- answerable purely from what was already said in this conversation

Also decide "fresh": is the message about something that happened or was
announced in the LAST FEW DAYS ("today", "yesterday", "this week", "just
announced", breaking news)? fresh = true routes the search to a news index.
fresh = false for stable topics, long-running policy, or history.

If search is true, write ONE search query:
- plain keywords only — NO quotes, NO site:, NO AND/OR operators, NO
  parentheses
- built from the concrete subject words of the topic (fares, caps, ferries,
  tax, wages) — avoid filler words like "policy", "announcement", "news"
- when the player says "your policy/plan/announcement", include the
  speaker's party or government name in the query — it distinguishes THEIR
  policy from councils, companies, and other parties
- self-contained: resolve "that", "it", "he", "your policy" from the
  conversation into concrete names and topics
- anchored to {region} when the topic is domestic politics or daily life
  there (add "{region}" to the query); leave genuinely global topics global
- aimed at the current state of things, not history
- NEVER put a year in the query unless the player's message names one (your
  sense of "this year" is out of date — it is {year} now, and the search
  engine already prefers recent results)

Respond with ONLY this JSON, nothing else:
{{"search": true or false, "fresh": true or false, "query": "the query, or empty string"}}"""


# deterministic freshness backstop: if the player explicitly frames the
# question around the last few days, route to the news index even when the
# 8b router misses it. this is what makes "announced today" questions find
# same-day coverage instead of evergreen policy pages.
_RECENCY_RE = re.compile(
    r"\b(today|yesterday|tonight|this (morning|afternoon|week)|"
    r"just (announced|released|launched|happened|said)|announced|"
    r"breaking|latest|in the news|"
    # "your new policy/ferry/tax..." implies a recent change — but "new"
    # must not match the country in "New Zealand"
    r"new (?!zealand)\w+)\b",
    re.IGNORECASE,
)


def _route(
    question: str,
    character: Character,
    history_tail: list[dict],
) -> tuple[bool, str, bool]:
    """LLM decision: (needs_search, query, fresh).

    Fails OPEN to a region-anchored search of the raw question — for a
    debate about current events, wrong-but-fresh beats confidently-stale.
    """
    is_recent = bool(_RECENCY_RE.search(question))
    fallback = (True, f"{question} {character.search_hint}", is_recent)

    convo_lines = [
        f"{'player' if m['role'] == 'user' else character.display_name}: {m['content']}"
        for m in history_tail
    ]
    convo = "\n".join(convo_lines) if convo_lines else "(start of conversation)"

    try:
        response = ollama.chat(
            model=ROUTER_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": _ROUTER_PROMPT.format(
                        today=date.today().strftime("%-d %B %Y"),
                        year=date.today().year,
                        identity=character.router_identity,
                        region=character.region,
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Recent conversation:\n{convo}\n\n"
                        f"Latest player message: {question}"
                    ),
                },
            ],
            format="json",
            options={
                "temperature": 0,
                "num_predict": ROUTER_NUM_PREDICT,
            },
        )
        decision = json.loads(response["message"]["content"])
    except Exception:
        # router is an optimisation, never a gate — search like the old code did
        return fallback

    needs_search = decision.get("search")
    if not isinstance(needs_search, bool):
        return fallback
    if not needs_search:
        return (False, "", False)

    query = decision.get("query")
    if not isinstance(query, str) or not query.strip():
        return fallback

    # the regex backstop can only ADD freshness — the router can't talk us
    # out of a news search when the player literally said "today".
    fresh = bool(decision.get("fresh")) or is_recent
    cleaned = _anchor_region(
        _anchor_affiliation(
            _sanitize_query(
                _strip_invented_years(query.strip(), question, history_tail)
            ),
            question,
            history_tail,
            character,
        ),
        character,
    )
    return (True, cleaned, fresh)


_YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")
# search-engine operator syntax the router sometimes invents (site:, -intitle:,
# boolean keywords, quoting/grouping). Tavily wants plain keywords.
_OPERATOR_RE = re.compile(r'[-]?\b(?:site|intitle|inurl):\S+|\b(?:AND|OR|NOT)\b|["()]')


def _sanitize_query(query: str) -> str:
    """Degrade operator-style router queries to the plain keywords inside."""
    cleaned = " ".join(_OPERATOR_RE.sub(" ", query).split())
    return cleaned or query


# words that already anchor a query to a character's part of the world. if a
# query has none of these, the character's search_hint is appended — relying
# on the router to do it let "labour party transport announcement" match
# Australian Labor news instead of NZ coverage.
_REGION_TOKENS = {
    "New Zealand": re.compile(
        r"\b(new zealand|nz|aotearoa|kiwi|kiwis|auckland|wellington|christchurch)\b",
        re.IGNORECASE,
    ),
    "United States": re.compile(
        r"\b(united states|u\.s\.|usa|us|america|american|washington|congress|white house)\b",
        re.IGNORECASE,
    ),
}


def _anchor_region(query: str, character: Character) -> str:
    """Guarantee the query names the character's region."""
    pattern = _REGION_TOKENS.get(character.region)
    if pattern and not pattern.search(query):
        return f"{query} {character.search_hint}"
    return query


# "your policy", "your new plan", "you announced..." — the player is asking
# about the speaker's OWN policy, so the query must name their party or it
# retrieves someone else's (Auckland Transport's existing fare cap buried
# Labour's announced one).
_OWNERSHIP_RE = re.compile(
    r"\byour\b[^?.!]*\b(policy|policies|plan|plans|announc\w+|proposal|scheme|promise)\b"
    r"|\byou\b\s+announc\w+",
    re.IGNORECASE,
)


def _anchor_affiliation(
    query: str,
    question: str,
    history_tail: list[dict],
    character: Character,
) -> str:
    """Prepend the speaker's party to queries about their own policy.

    Checks recent history too: a follow-up like "how much will that save?"
    inherits the ownership of the "your new policy..." question before it.
    """
    asked_about_own = any(
        _OWNERSHIP_RE.search(text)
        for text in [question, *(m["content"] for m in history_tail)]
    )
    if not asked_about_own:
        return query
    marker = character.affiliation.split()[0].lower()  # "labour" / "national" / "trump"
    if marker in query.lower():
        return query
    return f"{character.affiliation} {query}"


def _strip_invented_years(query: str, question: str, history_tail: list[dict]) -> str:
    """Remove years the player never mentioned from a router-written query.

    The 8b router writes its training-data's idea of "now" (or today's year)
    into queries no matter how it's prompted. A stale year biases Tavily
    toward old articles; a wrong year on a past event buries the real one.
    Years the player actually typed are kept — those are intentional.
    """
    mentioned = {
        m.group(0)
        for text in [question, *(turn["content"] for turn in history_tail)]
        for m in _YEAR_RE.finditer(text)
    }
    cleaned = _YEAR_RE.sub(
        lambda m: m.group(0) if m.group(0) in mentioned else "", query
    )
    return " ".join(cleaned.split()) or query


# ── tavily search + cache ────────────────────────────────────────────────────

# news searches look back this many days — wide enough to catch "earlier
# this week" follow-ups, narrow enough that old coverage doesn't crowd out
# a same-day announcement.
NEWS_WINDOW_DAYS = 7


def _search_web(query: str, fresh: bool, max_results: int = 5) -> str | None:
    """Top web results for `query` as one prompt-ready string.

    `fresh` routes to Tavily's news index with a recency window — the general
    index ranks evergreen policy pages above same-day announcements, which is
    how "explain the policy you announced today" used to come back empty.

    "" means the search ran and found nothing (a real signal — see false
    premise detection). None means the search FAILED, which must not be
    presented to the model as "no results found".
    """
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        return None

    params: dict = {
        "query": query,
        # advanced = slower + ~2x cost per query, but returns far richer per-
        # result content and a better Summary line. basic was missing key
        # context (e.g. oil/Shah history on Iran questions).
        "search_depth": "advanced",
        "max_results": max_results,
        "include_answer": True,
    }
    if fresh:
        params["topic"] = "news"
        params["days"] = NEWS_WINDOW_DAYS
    body = json.dumps(params).encode("utf-8")
    req = urllib.request.Request(
        TAVILY_URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError):
        return None

    parts: list[str] = []
    answer = data.get("answer")
    if answer:
        parts.append(f"Summary: {answer}")
    for result in data.get("results", [])[:max_results]:
        title = result.get("title", "").strip()
        content = result.get("content", "").strip()
        if title and content:
            parts.append(f"- {title}: {content}")
    return _trim("\n".join(parts))


def _trim(context: str) -> str:
    """Cap context at MAX_INTEL_CHARS, cutting on a line boundary."""
    if len(context) <= MAX_INTEL_CHARS:
        return context
    cut = context.rfind("\n", 0, MAX_INTEL_CHARS)
    return context[: cut if cut > 0 else MAX_INTEL_CHARS]


def _load_web_cache() -> dict:
    try:
        with open(WEB_CACHE) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_web_cache(cache: dict) -> None:
    with open(WEB_CACHE, "w") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)


def _search_web_cached(query: str, fresh: bool) -> str | None:
    """Cached `_search_web` — same query within the TTL skips the API call."""
    key = query.strip().lower()
    if not key:
        return None
    if fresh:
        key = f"news:{key}"  # don't serve stale general results to news asks

    cache = _load_web_cache()
    entry = cache.get(key)
    if entry and (time.time() - entry.get("ts", 0)) < WEB_CACHE_TTL_SECONDS:
        return entry.get("context", "")

    context = _search_web(query, fresh)
    if context:  # only cache real content; "" and failures should retry
        cache[key] = {"ts": time.time(), "context": context}
        _save_web_cache(cache)
    return context


# ── public entrypoint ────────────────────────────────────────────────────────

def gather(
    question: str,
    character: Character,
    history_messages: list[dict],
) -> IntelResult:
    """Run the full smalltalk -> router -> search pipeline for one message."""
    if is_smalltalk(question):
        return NO_INTEL

    # no key = no tooling. critically, this must NOT look like "searched and
    # found nothing", or every real event gets called a fake premise.
    if not os.environ.get("TAVILY_API_KEY"):
        return NO_INTEL

    needs_search, query, fresh = _route(
        question, character, history_messages[-ROUTER_HISTORY_TURNS:]
    )
    if not needs_search:
        return NO_INTEL

    # fresh questions hit BOTH indexes: the news index knows what happened
    # this week but ranks noisily; the general index retrieves far better but
    # can miss same-day stories. merged, the model sees both. non-fresh
    # questions stay single-call on the general index.
    if fresh:
        news = _search_web_cached(query, fresh=True)
        general = _search_web_cached(query, fresh=False)
        # general first: it retrieves better, and _trim cuts from the tail
        parts = [p for p in (general, news) if p]
        if news is None and general is None:  # both calls FAILED
            return NO_INTEL
        return IntelResult(searched=True, context=_trim("\n".join(parts)))

    context = _search_web_cached(query, fresh=False)
    if context is None:  # search failed — not the same as "no results"
        return NO_INTEL
    return IntelResult(searched=True, context=context)
