def format_logs_input(study, sleep, mood, user_msg: str) -> str:
    """Single prompt string fed to the LLMs."""
    return (
        "The user’s wellbeing data for the last 2 weeks is below.\n\n"
        f"Study sessions ({len(study)}): {study}\n\n"
        f"Sleep logs ({len(sleep)}): {sleep}\n\n"
        f"Mood logs ({len(mood)}): {mood}\n\n"
        f"User question: {user_msg}\n\n"
        "Answer helpfully and concisely, referring to the data when useful. Return the answer in plain text. Limit to about five sentences."
    )
