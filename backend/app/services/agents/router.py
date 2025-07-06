from .gemini_agent import chat_with_gemini
from .openai_agent import chat_with_openai


def run_agent(model: str, logs: dict, history: list, user_msg: str) -> str:
    if model == "openai":
        return chat_with_openai(
            logs["study"], logs["sleep"], logs["mood"], user_msg, history
        )
    if model == "gemini":
        return chat_with_gemini(
            logs["study"], logs["sleep"], logs["mood"], user_msg, history
        )
    raise ValueError("model must be 'openai' or 'gemini'")
