"""Fish Audio text-to-speech.

`synthesize(text)` returns MP3 bytes, or ``None`` when the feature is not
configured (no API key) so the rest of the pipeline can degrade gracefully
instead of crashing. The SDK is imported lazily so the backend still boots
(and `/ask` keeps working) even if `fish-audio-sdk` isn't installed yet.
"""

import os


def tts_enabled() -> bool:
    """True when Fish Audio is configured (key + voice reference present)."""
    return bool(os.getenv("FISH_API_KEY") and os.getenv("REFERENCE_ID"))


def synthesize(text: str) -> bytes | None:
    """Turn text into MP3 audio bytes. None if TTS is unavailable."""
    if not text or not tts_enabled():
        return None

    try:
        from fish_audio_sdk import Session, TTSRequest  # lazy: optional dep
    except ImportError:
        # SDK not installed yet — pipeline continues text-only.
        return None

    session = Session(os.environ["FISH_API_KEY"])
    reference_id = os.environ["REFERENCE_ID"]

    audio = bytearray()
    for chunk in session.tts(TTSRequest(reference_id=reference_id, text=text)):
        audio += chunk

    return bytes(audio) if audio else None
