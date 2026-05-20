from fastapi import FastAPI
from fastapi.responses import Response
from fish_audio_sdk import Session, TTSRequest
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key    = os.getenv("CLOUDINARY_API_KEY"),
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

session = Session(os.getenv("FISH_API_KEY"))
REFERENCE_ID = os.getenv("REFERENCE_ID")

@app.post("/speak")
def speak(payload: dict):
    text = payload["text"]

    audio_data = b""
    for chunk in session.tts(TTSRequest(
            reference_id=REFERENCE_ID,
            text=text
    )):
        audio_data += chunk

    return Response(content=audio_data, media_type="audio/mpeg")