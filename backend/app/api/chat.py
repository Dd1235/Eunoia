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
from app.services.supabase_logs import fetch_logs
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/session", response_model=StartSessionResponse)
def start_session(data: StartSessionRequest, uid: str = Depends(get_current_user)):
    if data.user_id != uid:
        raise HTTPException(403, "User mismatch")

    logs = fetch_logs(uid)
    sid = SessionStore.create(uid, logs)
    return {"session_id": sid, "reply": get_intro_reply(logs)}


@router.post("/message", response_model=ChatMessageResponse)
def send_message(payload: ChatRequest, uid: str = Depends(get_current_user)):
    if payload.user_id != uid:
        raise HTTPException(403, "User mismatch")

    sess = SessionStore.get(uid, payload.session_id)
    if not sess:
        raise HTTPException(404, "Session not found")

    SessionStore.append(uid, payload.session_id, "user", payload.message)
    reply = run_agent(payload.model, sess["logs"], sess["history"], payload.message)
    SessionStore.append(uid, payload.session_id, "agent", reply)
    return {"reply": reply, "history": sess["history"]}
