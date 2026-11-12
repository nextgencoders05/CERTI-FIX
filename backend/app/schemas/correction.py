from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class CorrectionCreateRequest(BaseModel):
    organization_id: int
    uploaded_certificate_id: int
    claimed_certificate_uid: Optional[str] = None
    requested_changes: dict[str, Any] = Field(..., description="Fields to correct, e.g. recipient_name, title, issue_date")
    reason: str = Field(..., min_length=5, max_length=2000)
    supporting_notes: Optional[str] = None


class CorrectionDecisionRequest(BaseModel):
    decision: str  # approved | rejected
    reviewer_notes: Optional[str] = None
    template_id: Optional[int] = None


class ApprovalRecordOut(BaseModel):
    id: int
    correction_request_id: int
    organization_id: int
    decided_by_user_id: Optional[int] = None
    decision: str
    decision_notes: Optional[str] = None
    new_certificate_uid: Optional[str] = None
    snapshot_before: Optional[dict[str, Any]] = None
    snapshot_after: Optional[dict[str, Any]] = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class CorrectionRequestOut(BaseModel):
    id: int
    request_code: str
    requester_id: int
    requester_name: Optional[str] = None
    organization_id: int
    organization_name: Optional[str] = None
    uploaded_certificate_id: int
    original_certificate_id: Optional[int] = None
    corrected_certificate_id: Optional[int] = None
    corrected_certificate_uid: Optional[str] = None
    claimed_certificate_uid: Optional[str] = None
    original_extracted_data: Optional[dict[str, Any]] = None
    requested_changes: dict[str, Any]
    reason: str
    supporting_notes: Optional[str] = None
    status: str
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    approval_records: list[ApprovalRecordOut] = []

    class Config:
        orm_mode = True
        from_attributes = True
