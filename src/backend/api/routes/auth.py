"""
Auth routes - Authentication endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from typing import Optional
import os
import logging

from api.middleware.auth import create_access_token, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()
security_basic = HTTPBasic()

# Demo-konto credentials från miljövariabler
DEMO_USERNAME = os.getenv("DEMO_USERNAME", "demo")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "TeknikLokaler2025!")
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

# Validera att demo-lösenordet är säkert i produktion
if not DEMO_MODE and (DEMO_PASSWORD == "admin" or len(DEMO_PASSWORD) < 16):
    raise RuntimeError(
        "DEMO_MODE is disabled but DEMO_PASSWORD is insecure. "
        "Set DEMO_PASSWORD to at least 16 characters or enable DEMO_MODE=true for development."
    )


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


@router.post("/login")
async def login(login_data: LoginRequest):
    """
    Login endpoint - Demo-konto autentisering

    Args:
        login_data: Login credentials

    Returns:
        JWT access token
    """
    # Inaktivera demo-läge om DEMO_MODE är false
    if not DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo login is disabled in production",
        )

    # Validera credentials
    if login_data.username != DEMO_USERNAME or login_data.password != DEMO_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Skapa JWT token
    access_token = create_access_token(data={"sub": login_data.username})

    logger.info(f"User {login_data.username} logged in successfully")

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        username=login_data.username
    )


@router.post("/login/basic")
async def login_basic(credentials: HTTPBasicCredentials = Depends(security_basic)):
    """
    HTTP Basic Auth login endpoint (för enkelhet)

    Args:
        credentials: HTTP Basic Auth credentials

    Returns:
        JWT access token
    """
    # Inaktivera demo-läge om DEMO_MODE är false
    if not DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo login is disabled in production",
        )

    # Validera credentials
    if credentials.username != DEMO_USERNAME or credentials.password != DEMO_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )

    # Skapa JWT token
    access_token = create_access_token(data={"sub": credentials.username})

    logger.info(f"User {credentials.username} logged in via Basic Auth")

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
