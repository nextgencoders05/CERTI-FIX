from datetime import date, datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class CertificateIssueRequest(BaseModel):
    template_id: Optional[int] = None
    category_id: Optional[int] = None
    recipient_name: str = Field(..., min_length=2, max_length=255)
    recipient_email: Optional[str] = None
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    issue_date: date
    expiry_date: Optional[date] = None
    grade_or_score: Optional[str] = None
    metadata_json: Optional[dict[str, Any]] = None


class CertificateOut(BaseModel):
    id: int
    certificate_uid: str
    organization_id: int
    organization_name: Optional[str] = None
    template_id: Optional[int] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    recipient_name: str
    recipient_email: Optional[str] = None
    title: str
    description: Optional[str] = None
    issue_date: date
    expiry_date: Optional[date] = None
    grade_or_score: Optional[str] = None
    qr_code_data: str
    is_corrected_reissue: bool
    supersedes_certificate_id: Optional[int] = None
    is_revoked: bool
    revoked_reason: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class UploadedCertificateOut(BaseModel):
    id: int
    uploader_id: int
    original_filename: str
    mime_type: str
    file_size_bytes: int
    file_sha256: str
    ocr_raw_text: Optional[str] = None
    ocr_extracted_fields: Optional[dict[str, Any]] = None
    ocr_confidence: Optional[float] = None
    ocr_status: str
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
