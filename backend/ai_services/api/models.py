# backend/ai_services/api/models.py
from pydantic import BaseModel, Field
from typing import Optional, Any

class AuthSignUp(BaseModel):
    name: str
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)

class AuthSignIn(BaseModel):
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)

class NoteCreate(BaseModel):
    title: Optional[str] = ""
    content: str
    metadata: Optional[Any] = None

class NotifyPreference(BaseModel):
    notify: bool = False
    notify_type: Optional[str] = Field(None, description="hourly or daily")
    notify_time: Optional[str] = Field(None, description="HH:MM for daily notifications")

class NoteSaveRequest(BaseModel):
    note: NoteCreate
    notify_pref: Optional[NotifyPreference] = None


from datetime import datetime
from uuid import UUID

class User(BaseModel):
    id: Optional[UUID] = None
    auth_user_id: Optional[UUID] = None
    name: str
    email: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

