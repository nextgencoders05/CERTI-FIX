from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.category import CertificateCategory
from app.models.certificate import Certificate
from app.models.organization import Organization, VerificationStatus
from app.models.verification import VerificationRecord
from app.schemas.verification import VerificationResponse
from app.security.rate_limiter import get_client_ip, limiter

router = APIRouter(prefix="/verify", tags=["Public Verification"])


@router.get("/{certificate_uid}", response_model=VerificationResponse)
@limiter.limit("60/minute")
def verify_certificate(
    request: Request,
    certificate_uid: str,
    method: str = "web",
    db: Session = Depends(get_db),
):
    uid = certificate_uid.strip()
    cert = db.query(Certificate).filter(Certificate.certificate_uid == uid).first()
    now = datetime.now(timezone.utc)

    if not cert:
        record = VerificationRecord(
            certificate_id=None,
            queried_uid=uid,
            is_valid=False,
            verification_method=method,
            verifier_ip=get_client_ip(request),
            user_agent=request.headers.get("User-Agent", "")[:255],
        )
        db.add(record)
        db.commit()
        return VerificationResponse(
            certificate_uid=uid,
            is_valid=False,
            status="not_found",
            message="No official certificate record found for this ID.",
            verified_at=now,
        )

    org = db.query(Organization).filter(Organization.id == cert.organization_id).first()
    cat = (
        db.query(CertificateCategory).filter(CertificateCategory.id == cert.category_id).first()
        if cert.category_id
        else None
    )
    org_verified = bool(org and org.verification_status == VerificationStatus.VERIFIED)
    is_valid = (not cert.is_revoked) and org_verified

    record = VerificationRecord(
        certificate_id=cert.id,
        queried_uid=uid,
        is_valid=is_valid,
        verification_method=method,
        verifier_ip=get_client_ip(request),
        user_agent=request.headers.get("User-Agent", "")[:255],
    )
    db.add(record)
    db.commit()

    if cert.is_revoked:
        status_str = "revoked"
        msg = f"This certificate was revoked: {cert.revoked_reason or 'Revoked by issuing organization.'}"
    elif not org_verified:
        status_str = "revoked"
        msg = "The issuing organization is currently not verified."
    else:
        status_str = "valid"
        msg = "Official certificate verified and authentic."

    return VerificationResponse(
        certificate_uid=cert.certificate_uid,
        is_valid=is_valid,
        status=status_str,
        message=msg,
        recipient_name=cert.recipient_name,
        title=cert.title,
        organization_name=org.name if org else None,
        organization_verified=org_verified,
        category_name=cat.name if cat else None,
        issue_date=cert.issue_date,
        expiry_date=cert.expiry_date,
        is_corrected_reissue=cert.is_corrected_reissue,
        verified_at=now,
    )
