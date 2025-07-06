from typing import Dict, List, Literal

from pydantic import BaseModel


class StartSessionRequest(BaseModel):
    user_id: str


class StartSessionResponse(BaseModel):
    session_id: str
    reply: str


class ChatRequest(BaseModel):
    """
    Request model for sending a chat message. Takes the session ID, user ID, message content,
    and the model type (default is "openai").
    """

    session_id: str
    user_id: str
    message: str
    model: Literal["openai", "gemini"] = "openai"


class ChatMessageResponse(BaseModel):
    """
    Response model for a chat message. Contains the AI's reply and the chat history.
    """

    reply: str
    history: List[Dict[str, str]]
