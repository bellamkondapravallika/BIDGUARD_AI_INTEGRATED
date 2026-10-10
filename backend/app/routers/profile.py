from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserSettings
from app.schemas.auth import UserResponse
from app.schemas.profile import (
    ProfileUpdateRequest,
    ChangePasswordRequest,
    SettingsUpdateRequest,
    SettingsResponse,
)
from app.security import (
    get_current_user,
    hash_password,
    verify_password,
)
from app.services.audit import record_audit_log

router = APIRouter(prefix="/api/v1", tags=["Profile & Settings"])


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.full_name is not None:
        current_user.full_name = req.full_name
    if req.organization is not None:
        current_user.organization = req.organization
    if req.department is not None:
        current_user.department = req.department
    if req.job_title is not None:
        current_user.job_title = req.job_title
    if req.phone_number is not None:
        current_user.phone_number = req.phone_number

    db.commit()
    db.refresh(current_user)

    record_audit_log(
        db=db,
        action="Updated Profile",
        entity_type="User",
        user_id=current_user.id,
        actor_name=current_user.full_name,
        entity_id=str(current_user.id),
        change_summary="User updated profile details.",
        outcome="SUCCESS",
    )

    return UserResponse.model_validate(current_user)


@router.post("/profile/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.confirm_password and req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match.")

    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    current_user.hashed_password = hash_password(req.new_password)
    db.commit()

    record_audit_log(
        db=db,
        action="Changed Password",
        entity_type="User",
        user_id=current_user.id,
        actor_name=current_user.full_name,
        entity_id=str(current_user.id),
        change_summary="User changed account password.",
        outcome="SUCCESS",
    )

    return {"message": "Password updated successfully."}


@router.get("/settings", response_model=SettingsResponse)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings_obj = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings_obj:
        settings_obj = UserSettings(user_id=current_user.id)
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)

    return SettingsResponse.model_validate(settings_obj)


@router.patch("/settings", response_model=SettingsResponse)
def update_settings(
    req: SettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings_obj = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings_obj:
        settings_obj = UserSettings(user_id=current_user.id)
        db.add(settings_obj)

    if req.email_notifications is not None:
        settings_obj.email_notifications = req.email_notifications
    if req.critical_risk_alerts is not None:
        settings_obj.critical_risk_alerts = req.critical_risk_alerts
    if req.dark_mode is not None:
        settings_obj.dark_mode = req.dark_mode
    if req.auto_analyze_on_upload is not None:
        settings_obj.auto_analyze_on_upload = req.auto_analyze_on_upload
    if req.items_per_page is not None:
        settings_obj.items_per_page = req.items_per_page

    db.commit()
    db.refresh(settings_obj)

    record_audit_log(
        db=db,
        action="Updated Settings",
        entity_type="UserSettings",
        user_id=current_user.id,
        actor_name=current_user.full_name,
        entity_id=str(settings_obj.id),
        change_summary="User preferences updated.",
        outcome="SUCCESS",
    )

    return SettingsResponse.model_validate(settings_obj)
