"""POST /api/login (rate-limited) + GET /api/me."""
from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..auth import issue_token, require_auth, verify_password


limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginRequest) -> LoginResponse:
    if not verify_password(payload.password):
        # Constant 1s delay on failure to slow brute-force.
        await asyncio.sleep(1.0)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")
    token, expires_in = issue_token()
    return LoginResponse(access_token=token, expires_in=expires_in)


@router.get("/me")
async def me(subject: str = Depends(require_auth)) -> dict:
    return {"subject": subject}
