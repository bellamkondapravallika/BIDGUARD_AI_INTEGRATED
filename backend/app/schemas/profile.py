from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    organization: Optional[str] = Field(None, min_length=2, max_length=150)
    department: Optional[str] = None
    job_title: Optional[str] = None
    phone_number: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=100)
    confirm_password: Optional[str] = None


class SettingsUpdateRequest(BaseModel):
    email_notifications: Optional[bool] = None
    critical_risk_alerts: Optional[bool] = None
    dark_mode: Optional[bool] = None
    auto_analyze_on_upload: Optional[bool] = None
    items_per_page: Optional[int] = Field(None, ge=5, le=100)


class SettingsResponse(BaseModel):
    email_notifications: bool
    critical_risk_alerts: bool
    dark_mode: bool
    auto_analyze_on_upload: bool
    items_per_page: int
    updated_at: datetime

    class Config:
        from_attributes = True
