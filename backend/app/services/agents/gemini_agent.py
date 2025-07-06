import os

from app.services.agents.base import format_logs_input
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def chat_with_gemini(study, sleep, mood, user_msg: str, history: list) -> str:
    prompt = format_logs_input(study, sleep, mood, user_msg)

    contents = []
    for turn in history[-6:]:
        role = (
            "user" if turn["role"] == "user" else "model"
        )  # map 'assistant' -> 'model'
        contents.append({"role": role, "parts": [{"text": turn["content"]}]})

    contents.append({"role": "user", "parts": [{"text": prompt}]})

    try:
        print("[Gemini] Sending prompt contents:", contents)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
        )

        if not response or not hasattr(response, "text") or not response.text:
            return "Gemini returned no response."

        return response.text.strip()

    except Exception as e:
        print("[Gemini] Error:", str(e))
        return "Gemini agent failed due to an internal error."
