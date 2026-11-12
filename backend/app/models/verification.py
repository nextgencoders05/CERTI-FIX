from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    certificate_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("certificates.id", ondelete="SET NULL"), nullable=True, index=True
    )
    queried_uid: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    is_valid: Mapped[bool] = mapped_column(Boolean, nullable=False)
    verification_method: Mapped[str] = mapped_column(String(32), default="web", nullable=False)
    verifier_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    certificate = relationship("Certificate", back_populates="verification_records")
