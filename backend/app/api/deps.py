from app.core.config import settings
from fastapi import Header, HTTPException
from jose import JWTError, jwt


def get_current_user(authorization: str | None = Header(None)) -> str:
    """
    Dev mode: if DEV_FAKE_UID is present, always return it.
    Prod: require and verify Supabase JWT.
    """
    if settings.DEV_FAKE_UID:
        return settings.DEV_FAKE_UID

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid Authorization header")

    try:
        payload = jwt.decode(
            authorization.removeprefix("Bearer ").strip(),
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
        )
        return payload["sub"]
    except (JWTError, KeyError):
        raise HTTPException(401, "Invalid token")
