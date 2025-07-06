from typing import Dict


def get_intro_reply(logs: Dict) -> str:
    """Human-friendly summary shown at session start."""
    return (
        "I’ve fetched your logs from the past two weeks.\n"
        f"- Study sessions: {len(logs['study'])}\n"
        f"- Sleep logs: {len(logs['sleep'])}\n"
        f"- Mood entries: {len(logs['mood'])}\n"
        "You can now ask things like “How has my sleep been?”"
    )
