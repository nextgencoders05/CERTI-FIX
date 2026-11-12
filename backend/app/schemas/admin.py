from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_email: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[dict[str, Any]] = None
    ip_address: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class PlatformStatsOut(BaseModel):
    total_users: int
    total_organizations: int
    verified_organizations: int
    pending_organizations: int
    total_certificates: int
    total_correction_requests: int
    pending_correction_requests: int
    approved_correction_requests: int
    total_verifications: int
