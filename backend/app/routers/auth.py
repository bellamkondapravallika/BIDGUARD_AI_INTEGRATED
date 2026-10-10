import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserSettings
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserResponse,
    AuthResponse,
)
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.services.audit import record_audit_log

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if req.confirm_password and req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # Check duplicate email
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # Create user
    user = User(
        email=req.email.lower(),
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        organization=req.organization,
        department=req.department or "Procurement Cell",
        role="Procurement Officer",
        is_active=True,
    )
    db.add(user)
    db.flush()

    # Create default settings
    settings_obj = UserSettings(user_id=user.id)
    db.add(settings_obj)

    db.commit()
    db.refresh(user)

    # Generate token
    token = create_access_token(data={"sub": str(user.id), "email": user.email})

    record_audit_log(
        db=db,
        action="User Registered",
        entity_type="User",
        user_id=user.id,
        actor_name=user.full_name,
        entity_id=str(user.id),
        change_summary=f"User {user.email} registered for organization {user.organization}.",
        outcome="SUCCESS",
    )

    return AuthResponse(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()

    if not user or not verify_password(req.password, user.hashed_password):
        # Record failed attempt in audit log
        record_audit_log(
            db=db,
            action="Login Failed",
            entity_type="User",
            user_id=user.id if user else None,
            actor_name=req.email,
            change_summary="Failed login attempt: invalid credentials.",
            outcome="FAILURE",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated. Please contact an administrator.",
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email})

    record_audit_log(
        db=db,
        action="User Login",
        entity_type="User",
        user_id=user.id,
        actor_name=user.full_name,
        entity_id=str(user.id),
        change_summary="Successful authentication to workspace.",
        outcome="SUCCESS",
    )

    return AuthResponse(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record_audit_log(
        db=db,
        action="User Logout",
        entity_type="User",
        user_id=current_user.id,
        actor_name=current_user.full_name,
        entity_id=str(current_user.id),
        change_summary="User terminated session.",
        outcome="SUCCESS",
    )
    return {"message": "Successfully logged out."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if user:
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()

        record_audit_log(
            db=db,
            action="Password Reset Requested",
            entity_type="User",
            user_id=user.id,
            actor_name=user.full_name,
            entity_id=str(user.id),
            change_summary=f"Reset token generated for {user.email}.",
            outcome="SUCCESS",
        )
        return {
            "message": "If this email is registered, password reset instructions and token have been issued.",
            "reset_token": reset_token,  # provided for offline/test environments
        }

    return {"message": "If this email is registered, password reset instructions and token have been issued."}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if req.confirm_password and req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    user = db.query(User).filter(User.reset_token == req.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if user.reset_token_expires_at and user.reset_token_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired.")

    user.hashed_password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    db.commit()

    record_audit_log(
        db=db,
        action="Password Reset Completed",
        entity_type="User",
        user_id=user.id,
        actor_name=user.full_name,
        entity_id=str(user.id),
        change_summary="Password was successfully reset.",
        outcome="SUCCESS",
    )

    return {"message": "Password successfully updated. You may now log in with your new password."}
