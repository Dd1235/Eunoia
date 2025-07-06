import wave
from io import BytesIO
from pathlib import Path

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
    return resp.choices[0].message.content.strip()


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
