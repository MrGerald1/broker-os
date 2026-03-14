"""
Auth service — pure Python JWT (HMAC-SHA256) to avoid cryptography/cffi issues.
"""
import hmac
import hashlib
import base64
import json
import time
import secrets
import string
from typing import Optional

import bcrypt
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.user import User

settings = get_settings()


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    if pad != 4:
        s += "=" * pad
    return base64.urlsafe_b64decode(s)


def _make_jwt(payload: dict) -> str:
    header = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    body = _b64url_encode(json.dumps(payload).encode())
    msg = f"{header}.{body}".encode()
    sig = hmac.new(settings.secret_key.encode(), msg, hashlib.sha256).digest()
    return f"{header}.{body}.{_b64url_encode(sig)}"


def _verify_jwt(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token format")
    header, body, sig = parts
    msg = f"{header}.{body}".encode()
    expected = hmac.new(settings.secret_key.encode(), msg, hashlib.sha256).digest()
    if not hmac.compare_digest(_b64url_decode(sig), expected):
        raise ValueError("Signature verification failed")
    payload = json.loads(_b64url_decode(body))
    if "exp" in payload and time.time() > payload["exp"]:
        raise ValueError("Token expired")
    return payload


def create_access_token(data: dict, expires_delta: Optional[int] = None) -> str:
    expires = int(time.time()) + (expires_delta or settings.access_token_expire_minutes * 60)
    payload = {**data, "exp": expires, "type": "access"}
    return _make_jwt(payload)


def create_refresh_token(data: dict) -> str:
    expires = int(time.time()) + settings.refresh_token_expire_days * 86400
    payload = {**data, "exp": expires, "type": "refresh"}
    return _make_jwt(payload)


def decode_token(token: str) -> dict:
    return _verify_jwt(token)


def generate_otp() -> str:
    return "".join(secrets.choice(string.digits) for _ in range(6))


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def send_otp_mock(email: str, otp: str) -> None:
    print(f"[MOCK EMAIL] To: {email} | OTP: {otp}")
