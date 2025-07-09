# backend/app/api/deps.py

from app.core.config import settings
from fastapi import Header, HTTPException
from jose import JWTError, jwt


def get_current_user(authorization: str | None = Header(None)) -> str:
    """
    Dev mode: if DEV_FAKE_UID is present, always return it.
    Prod: require and verify Supabase JWT.
    """
    # print(f"[DEBUG] get_current_user called. Authorization header: {authorization}")
    # if settings.DEV_FAKE_UID:
    #     print(f"[DEBUG] DEV_FAKE_UID is set: {settings.DEV_FAKE_UID}")
    #     return settings.DEV_FAKE_UID

    if not authorization or not authorization.startswith("Bearer "):
        # print(f"[DEBUG] Missing or invalid Authorization header: {authorization}")
        raise HTTPException(401, "Missing or invalid Authorization header")

    try:
        token = authorization.removeprefix("Bearer ").strip()
        # print(f"[DEBUG] Decoding JWT token: {token[:20]}... (truncated)")
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",  # Critical fix
        )
        # print(f"[DEBUG] JWT payload: {payload}")
        return payload["sub"]
    except (JWTError, KeyError) as e:
        # print(f"[DEBUG] Exception during JWT decode: {e}")
        raise HTTPException(401, "Invalid token")
