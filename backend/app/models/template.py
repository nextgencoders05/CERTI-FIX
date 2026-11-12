from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class CertificateTemplate(Base):
    __tablename__ = "certificate_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("certificate_categories.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    layout_style: Mapped[str] = mapped_column(String(50), default="classic_navy", nullable=False)
    primary_color: Mapped[str] = mapped_column(String(20), default="#1E3A8A", nullable=False)
    accent_color: Mapped[str] = mapped_column(String(20), default="#7C3AED", nullable=False)
    header_title: Mapped[str] = mapped_column(
        String(255), default="CERTIFICATE OF ACHIEVEMENT", nullable=False
    )
    body_template: Mapped[str] = mapped_column(
        Text,
        default="This is to certify that {recipient_name} has successfully completed {course_or_title} on {issue_date}.",
        nullable=False,
    )
    signatory_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    signatory_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    layout_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    organization = relationship("Organization", back_populates="templates")
    category = relationship("CertificateCategory", back_populates="templates")
    certificates = relationship("Certificate", back_populates="template")
