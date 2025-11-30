"""
Auth routes - Authentication endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from typing import Optional
from passlib.context import CryptContext
from slowapi import Limiter
from slowapi.util import get_remote_address
import os
import logging

from api.middleware.auth import create_access_token, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()
security_basic = HTTPBasic()

# Rate limiter - 5 försök per minut per IP
limiter = Limiter(key_func=get_remote_address)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Demo-konto credentials från miljövariabler
DEMO_USERNAME = os.getenv("DEMO_USERNAME", "demo")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD")  # Inget default-värde längre!
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"

# Validera demo-konfiguration
if DEMO_MODE:
    if not DEMO_PASSWORD:
        raise RuntimeError(
            "🚨 DEMO_MODE is enabled but DEMO_PASSWORD is not set! "
            "Set DEMO_PASSWORD environment variable to enable demo login."
        )
    if len(DEMO_PASSWORD) < 12:
        logger.warning(
            "⚠️  DEMO_PASSWORD is shorter than recommended (12+ characters). "
            "Consider using a stronger password."
        )
    # Hasha lösenordet vid start för säker jämförelse
    DEMO_PASSWORD_HASH = pwd_context.hash(DEMO_PASSWORD)
    logger.warning(
        "⚠️  DEMO MODE is enabled. This should only be used for development/testing."
    )
else:
    DEMO_PASSWORD_HASH = None
    logger.info("Demo login is disabled (DEMO_MODE=false)")


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, login_data: LoginRequest):
    """
    Login endpoint - Demo-konto autentisering

    Rate limited: 5 försök per minut per IP

    Args:
        request: FastAPI request (för rate limiting)
        login_data: Login credentials

    Returns:
        JWT access token
    """
    # Inaktivera demo-läge om DEMO_MODE är false
    if not DEMO_MODE:
        logger.warning(f"Login attempt blocked - demo mode disabled (IP: {get_remote_address(request)})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo login is disabled in production",
        )

    # Validera credentials med säker hash-jämförelse
    username_valid = login_data.username == DEMO_USERNAME
    password_valid = pwd_context.verify(login_data.password, DEMO_PASSWORD_HASH) if DEMO_PASSWORD_HASH else False

    if not (username_valid and password_valid):
        logger.warning(f"Failed login attempt for user '{login_data.username}' (IP: {get_remote_address(request)})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Skapa JWT token
    access_token = create_access_token(data={"sub": login_data.username})

    logger.info(f"User {login_data.username} logged in successfully (IP: {get_remote_address(request)})")

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        username=login_data.username
    )


@router.post("/login/basic")
@limiter.limit("5/minute")
async def login_basic(request: Request, credentials: HTTPBasicCredentials = Depends(security_basic)):
    """
    HTTP Basic Auth login endpoint (för enkelhet)

    Rate limited: 5 försök per minut per IP

    Args:
        request: FastAPI request (för rate limiting)
        credentials: HTTP Basic Auth credentials

    Returns:
        JWT access token
    """
    # Inaktivera demo-läge om DEMO_MODE är false
    if not DEMO_MODE:
        logger.warning(f"Basic auth login attempt blocked - demo mode disabled (IP: {get_remote_address(request)})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo login is disabled in production",
        )

    # Validera credentials med säker hash-jämförelse
    username_valid = credentials.username == DEMO_USERNAME
    password_valid = pwd_context.verify(credentials.password, DEMO_PASSWORD_HASH) if DEMO_PASSWORD_HASH else False

    if not (username_valid and password_valid):
        logger.warning(f"Failed basic auth login for user '{credentials.username}' (IP: {get_remote_address(request)})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )

    # Skapa JWT token
    access_token = create_access_token(data={"sub": credentials.username})

    logger.info(f"User {credentials.username} logged in via Basic Auth (IP: {get_remote_address(request)})")

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        username=credentials.username
    )


@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Hämta info om aktuell användare

    Args:
        current_user: Current user från JWT token

    Returns:
        User information
    """
    return {
        "username": current_user["username"],
        "authenticated": True
    }


@router.post("/logout")
async def logout():
    """
    Logout endpoint (för framtida implementering med token blacklist)
    """
    return {"message": "Logout successful"}
