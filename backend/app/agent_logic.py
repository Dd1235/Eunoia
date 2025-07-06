from typing import Dict


def get_intro_reply(logs: Dict) -> str:
    """
    Generate an introductory message summarizing the user's logs.

    Args:
        logs (Dict): A dictionary containing lists of log entries under keys
                     "study", "sleep", and "mood". Each key maps to a list of logs
                     for the past 2 weeks.

    Returns:
        str: A human-readable summary of how many study sessions, sleep logs,
             and mood entries were found. Meant to be used as an onboarding message
             at the start of a chat session.

    Example:
        logs = {
            "study": [...],  # list of study session dicts
            "sleep": [...],  # list of sleep logs
            "mood": [...]    # list of mood logs
        }
        reply = get_intro_reply(logs)
    """
    num_study = len(logs["study"])
    num_sleep = len(logs["sleep"])
    num_mood = len(logs["mood"])
    return (
        f"I’ve fetched your logs from the past two weeks.\n"
        f"- Study sessions: {num_study}\n"
        f"- Sleep logs: {num_sleep}\n"
        f"- Mood entries: {num_mood}\n"
        f"You can now ask me things like ‘how has my sleep been?’"
    )
