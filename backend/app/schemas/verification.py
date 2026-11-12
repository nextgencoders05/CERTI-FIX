from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class VerificationResponse(BaseModel):
    certificate_uid: str
    is_valid: bool
    status: str  # valid | revoked | not_found
    message: str
    recipient_name: Optional[str] = None
    title: Optional[str] = None
    organization_name: Optional[str] = None
    organization_verified: Optional[bool] = None
    category_name: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    is_corrected_reissue: Optional[bool] = None
    verified_at: datetime
