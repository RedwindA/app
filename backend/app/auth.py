"""JWT issue/verify + bcrypt password verify."""
from __future__ import annotations

import hashlib
import hmac
import time
from typing import Annotated

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException, status

from .config import Settings, get_settings


_PWD_HASH: bytes | None = None


def _digest(plaintext: str) -> bytes:
    """Bcrypt's input is capped at 72 bytes. Pre-hash with SHA-256 so any
    password length is supported and binary-safe.
    """
    return hashlib.sha256(plaintext.encode("utf-8")).digest()


def _password_hash(settings: Settings) -> bytes:
    global _PWD_HASH
    if _PWD_HASH is None:
        _PWD_HASH = bcrypt.hashpw(_digest(settings.app_password), bcrypt.gensalt())
    return _PWD_HASH


def verify_password(plaintext: str, settings: Settings | None = None) -> bool:
    settings = settings or get_settings()
    target = _password_hash(settings)
    try:
        ok = bcrypt.checkpw(_digest(plaintext), target)
    except (ValueError, TypeError):
        ok = False
    # Touch compare_digest so the timing footprint of the boolean branch above
    # has a constant-time partner regardless of outcome.
    hmac.compare_digest(b"x" * 32, b"x" * 32 if ok else b"y" * 32)
    return ok


def issue_token(subject: str = "owner", settings: Settings | None = None) -> tuple[str, int]:
    settings = settings or get_settings()
    now = int(time.time())
    exp_s = int(settings.app_jwt_exp_hours * 3600)
    payload = {"sub": subject, "iat": now, "exp": now + exp_s}
    token = jwt.encode(payload, settings.app_jwt_secret, algorithm="HS256")
    return token, exp_s


def _decode(token: str, settings: Settings) -> dict:
    return jwt.decode(token, settings.app_jwt_secret, algorithms=["HS256"])


def require_auth(
    authorization: Annotated[str | None, Header()] = None,
    settings: Annotated[Settings, Depends(get_settings)] = None,  # type: ignore[assignment]
) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = _decode(token, settings)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return payload.get("sub", "owner")
