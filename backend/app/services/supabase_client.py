from datetime import datetime, timedelta

from app.core.config import settings

from supabase import create_client

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def get_last_two_weeks_logs(user_id: str):
    """
    Fetches the last two weeks of logs for the given user_id.
    Returns a dict with keys 'study', 'sleep', and 'mood'.
    Each value is a list of dicts, each dict representing a row with all columns from the respective table.

    study_sessions columns:
        - id: uuid
        - user_id: uuid
        - started_at: timestamptz
        - ended_at: timestamptz
        - total_break_secs: integer
        - productivity: integer
        - note: text
    sleep_logs columns:
        - id: uuid
        - user_id: uuid
        - date: date
        - score: integer
        - note: text
    mood_logs columns:
        - id: uuid
        - user_id: uuid
        - at: timestamptz
        - score: integer
        - note: text

    Example return:
    {
        "study": [ { ...study_sessions row... }, ... ],
        "sleep": [ { ...sleep_logs row... }, ... ],
        "mood":  [ { ...mood_logs row... }, ... ]
    }
    """
    since = (datetime.utcnow() - timedelta(days=14)).isoformat()
    study = (
        supabase.table("study_sessions")
        .select("*")
        .eq("user_id", user_id)
        .gte("started_at", since)
        .order("started_at", desc=True)
        .execute()
    )
    sleep = (
        supabase.table("sleep_logs")
        .select("*")
        .eq("user_id", user_id)
        .gte("date", since[:10])
        .order("date", desc=True)
        .execute()
    )
    mood = (
        supabase.table("mood_logs")
        .select("*")
        .eq("user_id", user_id)
        .gte("at", since)
        .order("at", desc=True)
        .execute()
    )
    return {
        "study": study.data if hasattr(study, "data") else [],
        "sleep": sleep.data if hasattr(sleep, "data") else [],
        "mood": mood.data if hasattr(mood, "data") else [],
    }


def get_all_todos(user_id: str):
    """
    Fetches all todos for the given user_id.
    Returns a list of dicts, each dict representing a row with all columns from the todos table.

    todos columns:
        - id: uuid
        - user_id: uuid
        - content: text
        - done: boolean
        - created_at: timestamptz
        - priority: integer (if present)

    Example return:
    [ { ...todos row... }, ... ]
    """
    res = (
        supabase.table("todos")
        .select("*")
        .eq("user_id", user_id)
        .order("priority")
        .execute()
    )
    return res.data if hasattr(res, "data") else []


def get_long_term_goals(user_id: str):
    """
    Fetches all long-term goals for the given user_id.
    Returns a list of dicts, each dict representing a row with all columns from the long_term_goals table.

    long_term_goals columns:
        - id: uuid
        - user_id: uuid
        - goal: text
        - created_at: timestamptz

    Example return:
    [ { ...long_term_goals row... }, ... ]
    """
    res = (
        supabase.table("long_term_goals")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    return res.data if hasattr(res, "data") else []


def get_short_term_goals(user_id: str):
    """
    Fetches all short-term goals for the given user_id.
    Returns a list of dicts, each dict representing a row with all columns from the short_term_goals table.

    short_term_goals columns:
        - id: uuid
        - user_id: uuid
        - goal: text
        - created_at: timestamptz

    Example return:
    [ { ...short_term_goals row... }, ... ]
    """
    res = (
        supabase.table("short_term_goals")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    return res.data if hasattr(res, "data") else []
