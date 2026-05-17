import time
import cloudinary
import cloudinary.uploader
from sync import Sync
from sync.common import Audio, GenerationOptions, Video
from sync.core.api_error import ApiError
from dotenv import load_dotenv
import os

load_dotenv()

cloudinary.config(
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key    = os.getenv("CLOUDINARY_API_KEY"),
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
)

SYNC_API_KEY = os.getenv("SYNC_API_KEY")
TRUMP_VIDEO_URL = "https://res.cloudinary.com/dozzqm6mu/video/upload/v1778465952/TrumpTalking_qsdio1.mp4"

def generate_video(audio_bytes: bytes) -> str:
    """
    Takes raw audio bytes from Fish Audio.
    Uploads to Cloudinary, sends to Sync.so, returns the output video URL.
    """

    # Step 1 — Upload audio bytes to Cloudinary so Sync.so can reach it
    print("Uploading audio...")
    upload = cloudinary.uploader.upload(
        audio_bytes,
        resource_type="raw",
        format="wav"
    )
    audio_url = upload["secure_url"]
    print(f"Audio uploaded → {audio_url}")

    # Step 2 — Send to Sync.so
    client = Sync(
        base_url="https://api.sync.so",
        api_key=SYNC_API_KEY
    ).generations

    print("Starting lip sync generation...")
    try:
        response = client.create(
            input=[Video(url=TRUMP_VIDEO_URL), Audio(url=audio_url)],
            model="lipsync-2",
            options=GenerationOptions(sync_mode="loop"),
        )
    except ApiError as e:
        raise Exception(f"Sync.so failed: {e.status_code} - {e.body}")

    # Step 3 — Poll until done
    job = client.get(response.id)
    while job.status not in ["COMPLETED", "FAILED"]:
        print(f"Polling... {job.status}")
        time.sleep(10)
        job = client.get(response.id)

    if job.status == "FAILED":
        raise Exception("Sync.so generation failed")

    print(f"Done! Video URL: {job.output_url}")
    return job.output_url