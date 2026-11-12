from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class TemplateCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category_id: Optional[int] = None
    description: Optional[str] = None
    layout_style: str = "classic_navy"
    primary_color: str = "#1E3A8A"
    accent_color: str = "#7C3AED"
    header_title: str = "CERTIFICATE OF ACHIEVEMENT"
    body_template: str = "This is to certify that {recipient_name} has successfully completed {course_or_title} on {issue_date}."
    signatory_name: Optional[str] = None
    signatory_title: Optional[str] = None
    layout_config: Optional[dict[str, Any]] = None


class TemplateUpdateRequest(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    layout_style: Optional[str] = None
    primary_color: Optional[str] = None
    accent_color: Optional[str] = None
    header_title: Optional[str] = None
    body_template: Optional[str] = None
    signatory_name: Optional[str] = None
    signatory_title: Optional[str] = None
    layout_config: Optional[dict[str, Any]] = None
    is_active: Optional[bool] = None


class TemplateOut(BaseModel):
    id: int
    organization_id: int
    category_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    layout_style: str
    primary_color: str
    accent_color: str
    header_title: str
    body_template: str
    signatory_name: Optional[str] = None
    signatory_title: Optional[str] = None
    layout_config: Optional[dict[str, Any]] = None
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
