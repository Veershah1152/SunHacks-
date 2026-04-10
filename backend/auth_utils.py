import os
import time
from typing import Optional
from jose import jwt, JWTError
from google.oauth2 import id_token
from google.auth.transport import requests

# ── Config ──────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "vertex-command-center-ultra-secret")
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = time.time() + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_google_token(token: str) -> Optional[dict]:
    """
    Verifies Google ID Token and returns user info if valid.
    """
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        print("[Auth] GOOGLE_CLIENT_ID not set in env")
        return None
        
    if not token:
        print("[Auth] Token is empty")
        return None

    print(f"[Auth] Verifying token (len: {len(token)}, start: {token[:15]}...)")
        
    try:
        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)
        
        # ID token is valid. Return user identity from 'idinfo'.
        return {
            "google_id": idinfo['sub'],
            "email":     idinfo['email'],
            "name":      idinfo.get('name'),
            "picture":   idinfo.get('picture'),
        }
    except Exception as e:
        # Catch and print the specific error
        print(f"[Auth] Verification Exception ({type(e).__name__}): {e}")
        return None

def get_current_user_payload(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
