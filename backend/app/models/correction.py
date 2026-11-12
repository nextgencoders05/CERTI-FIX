import enum
from datetime import datetime, timezone
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class CorrectionStatus(str, enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class CorrectionRequest(Base):
    __tablename__ = "correction_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    request_code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    requester_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    uploaded_certificate_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("uploaded_certificates.id", ondelete="CASCADE"), nullable=False
    )
    original_certificate_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("certificates.id", ondelete="SET NULL"), nullable=True
    )
    corrected_certificate_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("certificates.id", ondelete="SET NULL"), nullable=True
    )
    claimed_certificate_uid: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    original_extracted_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    requested_changes: Mapped[dict] = mapped_column(JSON, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    supporting_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[CorrectionStatus] = mapped_column(
        Enum(CorrectionStatus, name="correction_status_enum"),
        default=CorrectionStatus.PENDING,
        nullable=False,
        index=True,
    )
    reviewer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    requester = relationship(
        "User", back_populates="correction_requests", foreign_keys=[requester_id]
    )
    organization = relationship("Organization", back_populates="correction_requests")
    uploaded_certificate = relationship(
        "UploadedCertificate", back_populates="correction_requests"
    )
    approval_records = relationship("ApprovalRecord", back_populates="correction_request")


class ApprovalRecord(Base):
    __tablename__ = "approval_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    correction_request_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("correction_requests.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    decided_by_user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    decision: Mapped[str] = mapped_column(String(32), nullable=False)  # approved | rejected
    decision_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_certificate_uid: Mapped[str | None] = mapped_column(String(64), nullable=True)
    snapshot_before: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    snapshot_after: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    correction_request = relationship("CorrectionRequest", back_populates="approval_records")
