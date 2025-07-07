# backend/app/services/meditation.py
import time
import wave
from io import BytesIO
from pathlib import Path

from app.services.supabase_client import supabase
from fastapi import HTTPException
from openai import AsyncOpenAI, OpenAI
from pydub import AudioSegment

client = OpenAI()
async_client = AsyncOpenAI()


def generate_transcript(topic: str) -> str:
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a meditation guide. <100 words."},
            {
                "role": "user",
                "content": f"Create a 1-minute calming meditation for: {topic}",
            },
        ],
    )
    content = resp.choices[0].message.content
    return content.strip() if content else ""


async def tts_to_wav(text: str) -> BytesIO:
    resp = await async_client.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice="nova",
        input=text,
        response_format="pcm",
    )
    pcm = await resp.aread()
    wav = BytesIO()
    with wave.open(wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24_000)
        wf.writeframes(pcm)
    wav.seek(0)
    return wav


def mix_with_bg(voice_wav: BytesIO, bg_path: Path) -> BytesIO:
    speech = AudioSegment.from_file(voice_wav, format="wav")
    bg = AudioSegment.from_file(bg_path) - 15
    if len(bg) < len(speech):
        bg *= len(speech) // len(bg) + 1
    final = speech.overlay(bg[: len(speech)])

    out = BytesIO()
    final.export(out, format="mp3")
    out.seek(0)
    return out


async def store_meditation(user_id: str, transcript: str, audio: BytesIO) -> str:
    """
    Uploads the meditation audio to Supabase Storage and inserts a row in the meditations table.
    Returns the public URL to the audio file.
    """
    if user_id != uid:
        raise HTTPException(403, "User mismatch")
    fname = f"{user_id}_{int(time.time())}.mp3"
    bucket = "meditations"
    # Upload to storage (no content_type or upsert params)
    res = supabase.storage.from_(bucket).upload(fname, audio.getvalue())
    if not getattr(res, "data", None):
        raise Exception("Failed to upload audio to Supabase Storage")
    # Get public URL (returns a string)
    public_url = supabase.storage.from_(bucket).get_public_url(fname)
    if not public_url:
        raise Exception("Failed to get public URL for uploaded audio")
    # Insert row in table
    row = {
        "user_id": user_id,
        "transcript": transcript,
        "audio_url": public_url,
    }
    supabase.table("meditations").insert(row).execute()
    return public_url
