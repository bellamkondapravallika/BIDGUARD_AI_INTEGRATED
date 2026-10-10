from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    bid_case_id: str
    user_id: int
    original_filename: str
    file_type: str
    file_size: int
    processing_status: str
    extracted_text_snippet: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
