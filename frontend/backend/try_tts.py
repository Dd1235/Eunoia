import asyncio
import wave

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

openai = AsyncOpenAI()


async def main():
    response = await openai.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice="alloy",
        input="Today is a wonderful day to build something people love!",
        response_format="pcm",
    )

    # Save as .wav file
    with wave.open("output.wav", "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)
        wf.writeframes(await response.aread())

    print("Audio saved to output.wav")


asyncio.run(main())
# afplay output.wav  # macOS built-in audio player
