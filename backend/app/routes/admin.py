from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.audit import AuditLog
from app.models.certificate import Certificate
from app.models.correction import CorrectionRequest, CorrectionStatus
from app.models.organization import Organization, VerificationStatus
from app.models.user import User, UserRole
from app.models.verification import VerificationRecord
from app.schemas.admin import AuditLogOut, PlatformStatsOut
from app.schemas.organization import OrganizationOut, OrganizationVerifyRequest
from app.schemas.user import UserOut
from app.security.auth import require_roles
from app.services.audit_service import log_audit_event
from app.services.notification_service import create_notification

router = APIRouter(prefix="/admin", tags=["Super Admin"])


@router.get("/stats", response_model=PlatformStatsOut)
def get_platform_stats(
    _admin: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    return PlatformStatsOut(
        total_users=db.query(User).count(),
        total_organizations=db.query(Organization).count(),
        verified_organizations=db.query(Organization)
        .filter(Organization.verification_status == VerificationStatus.VERIFIED)
        .count(),
        pending_organizations=db.query(Organization)
        .filter(Organization.verification_status == VerificationStatus.PENDING)
        .count(),
        total_certificates=db.query(Certificate).count(),
        total_correction_requests=db.query(CorrectionRequest).count(),
        pending_correction_requests=db.query(CorrectionRequest)
        .filter(CorrectionRequest.status == CorrectionStatus.PENDING)
        .count(),
        approved_correction_requests=db.query(CorrectionRequest)
        .filter(CorrectionRequest.status == CorrectionStatus.APPROVED)
        .count(),
        total_verifications=db.query(VerificationRecord).count(),
    )


@router.get("/users", response_model=list[UserOut])
def list_all_users(
    role: str | None = Query(default=None),
    _admin: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == UserRole(role))
    return query.order_by(User.created_at.desc()).limit(200).all()


@router.patch("/users/{user_id}/status", response_model=UserOut)
def toggle_user_status(
    user_id: int,
    is_active: bool,
    admin: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate your own admin account")

    user.is_active = is_active
    db.commit()
    db.refresh(user)

    log_audit_event(
        db,
        action="USER_STATUS_UPDATED",
        resource_type="user",
        resource_id=str(user.id),
        actor=admin,
        description=f"User {user.email} set active={is_active}",
    )
    return user


@router.get("/organizations", response_model=list[OrganizationOut])
def list_all_organizations(
    status_filter: str | None = Query(default=None),
    _admin: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    query = db.query(Organization)
    if status_filter:
        query = query.filter(Organization.verification_status == VerificationStatus(status_filter))
    orgs = query.order_by(Organization.created_at.desc()).all()
    return [
        OrganizationOut(
            id=o.id,
            owner_id=o.owner_id,
            name=o.name,
            slug=o.slug,
            registration_number=o.registration_number,
            domain=o.domain,
            website=o.website,
            contact_email=o.contact_email,
            address=o.address,
            description=o.description,
            has_logo=bool(o.logo_path),
            verification_status=o.verification_status.value,
            verified_at=o.verified_at,
            rejection_reason=o.rejection_reason,
            created_at=o.created_at,
        )
        for o in orgs
    ]


@router.post("/organizations/{org_id}/verify", response_model=OrganizationOut)
def verify_organization(
    org_id: int,
    payload: OrganizationVerifyRequest,
    admin: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    try:
        new_status = VerificationStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification status")

    org.verification_status = new_status
    org.verified_by_id = admin.id
    org.verified_at = datetime.now(timezone.utc) if new_status == VerificationStatus.VERIFIED else None
    org.rejection_reason = payload.rejection_reason
    db.commit()
    db.refresh(org)

    create_notification(
        db,
        user_id=org.owner_id,
        title=f"Organization Status: {new_status.value.title()}",
        message=f"Your organization '{org.name}' is now {new_status.value}.",
        category="success" if new_status == VerificationStatus.VERIFIED else "warning",
        link="/org/dashboard",
    )

    log_audit_event(
        db,
        action="ORGANIZATION_VERIFICATION_UPDATED",
        resource_type="organization",
        resource_id=str(org.id),
        actor=admin,
        description=f"Organization '{org.name}' marked as {new_status.value}",
    )

    return OrganizationOut(
        id=org.id,
        owner_id=org.owner_id,
        name=org.name,
        slug=org.slug,
        registration_number=org.registration_number,
        domain=org.domain,
        website=org.website,
        contact_email=org.contact_email,
        address=org.address,
        description=org.description,
        has_logo=bool(org.logo_path),
        verification_status=org.verification_status.value,
        verified_at=org.verified_at,
        rejection_reason=org.rejection_reason,
        created_at=org.created_at,
    )


@router.get("/audit-logs", response_model=list[AuditLogOut])
def get_audit_logs(
    action: str | None = Query(default=None),
    _admin: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action.strip()}%"))
    return query.order_by(AuditLog.created_at.desc()).limit(250).all()
