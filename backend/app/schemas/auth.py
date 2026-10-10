from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    organization: str = Field(min_length=2, max_length=150)
    department: Optional[str] = None
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    confirm_password: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=100)
    confirm_password: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    organization: str
    department: Optional[str] = None
    job_title: Optional[str] = None
    phone_number: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
