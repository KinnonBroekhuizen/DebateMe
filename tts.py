"""Fish Audio text-to-speech.

`synthesize(text)` returns MP3 bytes, or ``None`` when the feature is not
configured (no API key) so the rest of the pipeline can degrade gracefully
instead of crashing. The SDK is imported lazily so the backend still boots
(and `/ask` keeps working) even if `fish-audio-sdk` isn't installed yet.
"""

import os


def tts_enabled() -> bool:
    """True when Fish Audio is configured (key + at least one voice present)."""
    return bool(os.getenv("FISH_API_KEY") and os.getenv("REFERENCE_ID"))


def _reference_id_for(character: str | None) -> str | None:
    """Fish Audio voice id for a character slug (trump/luxon/hipkins).

    Per-character `REFERENCE_ID_<SLUG>` so each politician keeps their own
    voice. A known character with no configured voice returns None — we'd
    rather stay silent than have Hipkins speak in Trump's voice. With no
    character (e.g. /speak), fall back to the generic `REFERENCE_ID`.
    """
    if character:
        return os.getenv(f"REFERENCE_ID_{character.upper()}")
    return os.getenv("REFERENCE_ID")


def synthesize(text: str, character: str | None = None) -> bytes | None:
    """Turn text into MP3 audio bytes using `character`'s voice.

    None when TTS is unavailable or this character has no configured voice.
    """
    if not text or not os.getenv("FISH_API_KEY"):
        return None

    reference_id = _reference_id_for(character)
    if not reference_id:
        return None

    try:
        from fish_audio_sdk import Session, TTSRequest  # lazy: optional dep
    except ImportError:
        # SDK not installed yet — pipeline continues text-only.
        return None

    session = Session(os.environ["FISH_API_KEY"])

    audio = bytearray()
    for chunk in session.tts(TTSRequest(reference_id=reference_id, text=text)):
        audio += chunk

    return bytes(audio) if audio else None
