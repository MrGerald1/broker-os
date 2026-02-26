from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.models.wallet import Wallet
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    get_password_hash,
    generate_otp,
    send_otp_mock,
    decode_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])
_settings = get_settings()


def _maybe_demo_otp(otp: str) -> dict:
    """Only return OTP in response body when running in dev mode."""
    if _settings.is_dev:
        return {"demo_otp": otp}
    return {}


class SignupRequest(BaseModel):
    account_type: str
    email: str
    phone: str
    password: str
    business_name: str | None = None
    ncrib_license_number: str | None = None
    business_address: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class OTPVerifyRequest(BaseModel):
    email: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/signup", status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    otp = generate_otp()
    otp_expires = datetime.utcnow() + timedelta(minutes=10)

    commission_type = "flat_4_percent" if payload.account_type == "agent" else "custom"
    status_val = "active" if payload.account_type == "agent" else "pending_verification"

    user = User(
        account_type=payload.account_type,
        email=payload.email,
        phone=payload.phone,
        hashed_password=get_password_hash(payload.password),
        business_name=payload.business_name,
        ncrib_license_number=payload.ncrib_license_number,
        business_address=payload.business_address,
        commission_type=commission_type,
        status=status_val,
        role="admin",
        otp_code=otp,
        otp_expires_at=otp_expires,
        email_verified=False,
    )
    db.add(user)
    db.flush()

    wallet = Wallet(broker_id=user.id)
    db.add(wallet)
    db.commit()
    db.refresh(user)

    send_otp_mock(payload.email, otp)

    return {
        "message": "Account created. Please verify your email.",
        "email": payload.email,
        "requires_otp": True,
        **_maybe_demo_otp(otp),
    }


@router.post("/verify-otp")
def verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    if user.otp_code != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if user.otp_expires_at and datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

    user.email_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()

    access_token = create_access_token({"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token({"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_user_dict(user),
    )


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.email_verified:
        otp = generate_otp()
        user.otp_code = otp
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
        db.commit()
        send_otp_mock(payload.email, otp)
        return {
            "requires_otp": True,
            "email": payload.email,
            "message": "Please verify your email first.",
            **_maybe_demo_otp(otp),
        }

    user.last_login_at = datetime.utcnow()
    db.commit()

    access_token = create_access_token({"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token({"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_user_dict(user),
    )


@router.post("/refresh")
def refresh_token(token: str, db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = db.query(User).filter(User.id == payload["sub"]).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token({"sub": user.id, "email": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/resend-otp")
def resend_otp(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    otp = generate_otp()
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    send_otp_mock(email, otp)
    return {"message": "OTP resent", **_maybe_demo_otp(otp)}


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "account_type": user.account_type,
        "role": user.role,
        "status": user.status,
        "business_name": user.business_name,
        "phone": user.phone,
        "email_verified": user.email_verified,
        "commission_type": user.commission_type,
    }
