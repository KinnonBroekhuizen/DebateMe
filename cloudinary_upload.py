"""Cloudinary audio hosting.

`upload_audio(audio_bytes)` uploads the TTS clip to Cloudinary and returns a
public ``secure_url``, or ``None`` when Cloudinary is not configured / the
upload fails — so the pipeline degrades gracefully (no video → mouth-flap).

This is the Bridge-branch `quickstart.py` approach: Sync.so fetches the audio
by URL, so it must live somewhere public. Cloudinary hosts it externally, so
the backend itself never has to be publicly reachable.

Config is read ONLY from the CLOUDINARY_* environment variables.
"""

import os

_CLOUDINARY_VARS = (
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
)


def cloudinary_enabled() -> bool:
    """True when all Cloudinary credentials are present."""
    return all(os.getenv(v) for v in _CLOUDINARY_VARS)


def upload_audio(audio_bytes: bytes | None) -> str | None:
    """Upload audio bytes to Cloudinary; return its public URL or None."""
    if not audio_bytes or not cloudinary_enabled():
        return None

    try:
        import cloudinary  # lazy: optional dep
        import cloudinary.uploader
    except ImportError:
        return None

    cloudinary.config(
        cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
        api_key=os.environ["CLOUDINARY_API_KEY"],
        api_secret=os.environ["CLOUDINARY_API_SECRET"],
    )

    try:
        # Fish Audio returns MP3 (tts.py), so upload as an audio/video
        # resource — Cloudinary's documented way to host audio and hand
        # back a fetchable secure URL. (The branch used raw/wav, which was
        # wrong for this pipeline's MP3 output.)
        upload = cloudinary.uploader.upload(
            audio_bytes,
            resource_type="video",
            format="mp3",
        )
    except Exception:
        return None

    return upload.get("secure_url")
