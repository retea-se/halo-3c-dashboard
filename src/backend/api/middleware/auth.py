"""
Authentication Middleware - JWT token validation
"""
from fastapi import HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from jose import JWTError, jwt
import os
import logging
import secrets

logger = logging.getLogger(__name__)

# Auto_error=False gör att dependency inte kastar 403 automatiskt om header saknas
security = HTTPBearer(auto_error=False)

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"

# Validera JWT_SECRET_KEY baserat på miljö
if not SECRET_KEY:
    if DEMO_MODE:
        # I demo-läge: generera temporär nyckel men varna tydligt
        SECRET_KEY = secrets.token_urlsafe(32)
        logger.warning(
            "⚠️  JWT_SECRET_KEY not set! Generated temporary key for DEMO MODE. "
            "Tokens will be invalidated on restart. "
            "Set JWT_SECRET_KEY environment variable for persistent sessions."
        )
    else:
        # I produktion: fail fast - kräv att nyckeln är satt
        raise RuntimeError(
            "🚨 SECURITY ERROR: JWT_SECRET_KEY must be set in production! "
            "Either set JWT_SECRET_KEY environment variable or enable DEMO_MODE=true for development. "
            "Generate a secure key with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
        )
else:
    # Validera att nyckeln är tillräckligt lång
    if len(SECRET_KEY) < 32:
        logger.warning(
            "⚠️  JWT_SECRET_KEY is shorter than recommended (32+ characters). "
            "Consider using a longer key for better security."
        )


def create_access_token(data: dict, expires_delta: Optional[int] = None):
    """
    Skapa JWT access token

    Args:
        data: Data att inkludera i token
        expires_delta: Expiration time i sekunder (default: 24h)

    Returns:
        Encoded JWT token
    """
    from datetime import datetime, timedelta

    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + timedelta(seconds=expires_delta)
    else:
        expire = datetime.utcnow() + timedelta(hours=24)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    Verifiera JWT token

    Args:
        token: JWT token att verifiera

    Returns:
        Token payload om giltig, annars None
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"Token verification failed: {e}")
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Dependency för att hämta aktuell användare från JWT token

    Args:
        credentials: HTTP Authorization credentials

    Returns:
        User data från token

    Raises:
        HTTPException: Om token är ogiltig eller saknas
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {"username": username, "payload": payload}
