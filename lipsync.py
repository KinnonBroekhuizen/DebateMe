"""Sync.so lip-sync.

`generate(audio_url)` drives a base talking-head video with the supplied
audio and returns the finished video URL, or ``None`` when lip-sync is not
configured / fails. Sync.so fetches the audio from a public URL — the caller
hosts the clip on Cloudinary first (see cloudinary_upload.py) and passes that
secure URL here.

The API key is read ONLY from the SYNC_API_KEY environment variable. The key
that was hardcoded in the old branch `quickstart.py` files must be rotated.
"""

import os
import time

# Sync.so jobs are async; poll until done. Kept modest so a stuck job can't
# hang the request forever — on timeout we return None and the frontend
# falls back to the mouth-flap animation.
POLL_INTERVAL_S = 6
MAX_POLLS = 40  # ~4 min ceiling


def lipsync_enabled() -> bool:
    """True when Sync.so is configured (API key + base video present)."""
    return bool(os.getenv("SYNC_API_KEY") and os.getenv("TRUMP_BASE_VIDEO_URL"))


def generate(audio_url: str | None) -> str | None:
    """Lip-sync the base video to `audio_url`. None if unavailable/failed."""
    if not audio_url or not lipsync_enabled():
        return None

    try:
        from sync import Sync  # lazy: optional dep
        from sync.common import Audio, GenerationOptions, Video
        from sync.core.api_error import ApiError
    except ImportError:
        return None

    client = Sync(
        base_url="https://api.sync.so",
        api_key=os.environ["SYNC_API_KEY"],
    ).generations
    base_video_url = os.environ["TRUMP_BASE_VIDEO_URL"]

    try:
        response = client.create(
            input=[Video(url=base_video_url), Audio(url=audio_url)],
            model="lipsync-2",
            options=GenerationOptions(sync_mode="cut_off"),
            output_file_name="debate",
        )
    except ApiError:
        return None

    job_id = response.id
    for _ in range(MAX_POLLS):
        generation = client.get(job_id)
        if generation.status == "COMPLETED":
            return generation.output_url
        if generation.status == "FAILED":
            return None
        time.sleep(POLL_INTERVAL_S)

    return None  # timed out — caller falls back to mouth-flap
