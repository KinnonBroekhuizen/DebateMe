# quickstart.py
import time
from sync import Sync
from sync.common import Audio, GenerationOptions, Video
from sync.core.api_error import ApiError
from pydub import AudioSegment
import io
import requests
import os

api_key = "sk-MH0yUvb4TD-inNrKrdRRyg.wKYDDjoktublGYvL637W8gwPH6v44dMm" 

fish_response = requests.post(
    "https://api.fish.audio/v1/tts",
    headers={
        "Authorization": f"Bearer {}",
        "Content-Type": "application/json",
    },
    json={"text": "Your debate speech goes here", "format": "mp3"}
)

# Convert the mp3 bytes to a wav file
mp3_bytes = io.BytesIO(fish_response.content)
audio = AudioSegment.from_mp3(mp3_bytes)
audio.export("debate_audio.wav", format="wav")
print("Audio converted and saved as debate_audio.wav")
# ─────────────────────────────────────────────────────────────────────────────

video_url = "https://assets.sync.so/docs/example-video.mp4"
audio_url = "https://assets.sync.so/docs/example-audio.wav"  # ← we'll update this next

# Sends this info from the client side
client = Sync(
    base_url="https://api.sync.so", 
    api_key=api_key
).generations

# Visual indicator in terminal that it has started the job
print("Starting lip sync generation job...")

# Creates the video
try:
    response = client.create(
        input=[Video(url=video_url),Audio(url=audio_url)],
        model="lipsync-2",
        options=GenerationOptions(sync_mode="cut_off"),
        output_file_name="quickstart"
    )
except ApiError as e:
    print(f'create generation request failed with status code {e.status_code} and error {e.body}')
    exit()

job_id = response.id
print(f"Generation submitted successfully, job id: {job_id}")

generation = client.get(job_id)
status = generation.status

# Quick timer to show that it is working, onc edone displayed
while status not in ['COMPLETED', 'FAILED']:
    print('polling status for generation', job_id)
    time.sleep(10)
    generation = client.get(job_id)
    status = generation.status

# Exception catching
if status == 'COMPLETED':
    print('generation', job_id, 'completed successfully, output url:', generation.output_url)
else:
    print('generation', job_id, 'failed')