# backend/app/api/chat.py
from app.api.deps import get_current_user
from app.models.chat import (
    ChatMessageResponse,
    ChatRequest,
    StartSessionRequest,
    StartSessionResponse,
)
from app.services.agent_logic import get_intro_reply
from app.services.agents.router import run_agent
from app.services.session_store import SessionStore
from app.services.supabase_client import supabase
from app.services.supabase_logs import fetch_logs
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/session", response_model=StartSessionResponse)
def start_session(data: StartSessionRequest, uid: str = Depends(get_current_user)):
    if data.user_id != uid:
        raise HTTPException(status_code=403, detail="User mismatch")

    logs = fetch_logs(uid)
    sid = SessionStore.create(uid, logs)
    return {"session_id": sid, "reply": get_intro_reply(logs)}


@router.post("/message", response_model=ChatMessageResponse)
def send_message(payload: ChatRequest, uid: str = Depends(get_current_user)):
    if payload.user_id != uid:
        raise HTTPException(status_code=403, detail="User mismatch")

    sess = SessionStore.get(uid, payload.session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    SessionStore.append(uid, payload.session_id, "user", payload.message)
    reply = run_agent(payload.model, sess["logs"], sess["history"], payload.message)
    SessionStore.append(uid, payload.session_id, "assistant", reply)
    return {"reply": reply, "history": sess["history"]}


@router.get("/session/exists")
def session_exists(uid: str = Depends(get_current_user)):
    res = (
        supabase.table("chat_sessions")
        .select("session_id")
        .eq("user_id", uid)
        .single()
        .execute()
    )
    return {"session_id": res.data["session_id"] if res and res.data else None}


@router.get("/session/full")
def get_full_session(uid: str = Depends(get_current_user)):
    res = (
        supabase.table("chat_sessions")
        .select("session_id,logs,history")
        .eq("user_id", uid)
        .single()
        .execute()
    )
    if not res or not res.data:
        return {"session_id": None, "logs": None, "history": None}

    import json

    data = res.data
    return {
        "session_id": data["session_id"],
        "logs": (
            data["logs"] if isinstance(data["logs"], dict) else json.loads(data["logs"])
        ),
        "history": (
            data["history"]
            if isinstance(data["history"], list)
            else json.loads(data["history"])
        ),
    }
