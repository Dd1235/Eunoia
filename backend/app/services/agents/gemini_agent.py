import os

import google.generativeai as genai
from app.services.agents.base import format_logs_input

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")


def chat_with_gemini(study, sleep, mood, user_msg: str, _history) -> str:
    prompt = format_logs_input(study, sleep, mood, user_msg)
    return model.generate_content(prompt).text.strip()
