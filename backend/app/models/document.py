from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    bid_case_id = Column(String(50), ForeignKey("bid_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, xlsx, txt, csv
    file_size = Column(Integer, default=0, nullable=False)  # bytes
    storage_path = Column(String(500), nullable=False)
    processing_status = Column(String(50), default="Uploaded", nullable=False)  # Uploaded, Processing, Processed, Failed
    extracted_text = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)  # JSON formatted metadata (entities, dates, pages)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    bid_case = relationship("BidCase", back_populates="documents")
    user = relationship("User", back_populates="documents")
