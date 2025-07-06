from app.ai.gemini_agent import chat_with_gemini
from app.ai.openai_agent import chat_with_openai


def chat_router(
    model_name: str, study_logs, sleep_logs, mood_logs, user_message: str
) -> str:
    if model_name == "gemini":
        return chat_with_gemini(study_logs, sleep_logs, mood_logs, user_message)
    elif model_name == "openai":
        return chat_with_openai(study_logs, sleep_logs, mood_logs, user_message)
    else:
        raise ValueError("Invalid model selected. Choose from: 'gemini', 'openai'.")
