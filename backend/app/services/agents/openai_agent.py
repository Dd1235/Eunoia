from app.core.config import settings
from app.services.agents.base import format_logs_input
from openai import OpenAI

client = OpenAI()
# client = OpenAI(api_key=settings.OPENAI_API_KEY)


def chat_with_openai(study, sleep, mood, user_msg: str, history: list) -> str:
    prompt = format_logs_input(study, sleep, mood, user_msg)
    messages = [
        {"role": "system", "content": "You are a wellbeing assistant."},
        *history[-6:],  # keep context short
        {"role": "user", "content": prompt},
    ]
    resp = client.chat.completions.create(model="gpt-4o-mini", messages=messages)
    return resp.choices[0].message.content.strip()
