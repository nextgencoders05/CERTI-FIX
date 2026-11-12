from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class OrganizationOut(BaseModel):
    id: int
    owner_id: int
    name: str
    slug: str
    registration_number: Optional[str] = None
    domain: Optional[str] = None
    website: Optional[str] = None
    contact_email: str
    address: Optional[str] = None
    description: Optional[str] = None
    has_logo: bool = False
    verification_status: str
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class OrganizationUpdateRequest(BaseModel):
    name: Optional[str] = None
    registration_number: Optional[str] = None
    domain: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None


class OrganizationVerifyRequest(BaseModel):
    status: str  # verified | rejected | suspended
    rejection_reason: Optional[str] = None
