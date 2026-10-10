from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    actor_name: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    change_summary: str
    outcome: str
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
