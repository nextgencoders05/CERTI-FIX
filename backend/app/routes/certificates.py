import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database.session import get_db
from app.models.category import CertificateCategory
from app.models.certificate import Certificate
from app.models.organization import Organization, VerificationStatus
from app.models.template import CertificateTemplate
from app.models.user import User, UserRole
from app.schemas.certificate import CertificateIssueRequest, CertificateOut
from app.security.auth import get_current_user, require_roles
from app.security.file_security import resolve_private_path
from app.services.audit_service import log_audit_event
from app.services.pdf_service import generate_certificate_pdf

settings = get_settings()
router = APIRouter(prefix="/certificates", tags=["Certificates"])


def _to_cert_out(cert: Certificate, db: Session) -> CertificateOut:
    org = db.query(Organization).filter(Organization.id == cert.organization_id).first()
    cat = db.query(CertificateCategory).filter(CertificateCategory.id == cert.category_id).first() if cert.category_id else None
    return CertificateOut(
        id=cert.id,
        certificate_uid=cert.certificate_uid,
        organization_id=cert.organization_id,
        organization_name=org.name if org else None,
        template_id=cert.template_id,
        category_id=cert.category_id,
        category_name=cat.name if cat else None,
        recipient_name=cert.recipient_name,
        recipient_email=cert.recipient_email,
        title=cert.title,
        description=cert.description,
        issue_date=cert.issue_date,
        expiry_date=cert.expiry_date,
        grade_or_score=cert.grade_or_score,
        qr_code_data=cert.qr_code_data,
        is_corrected_reissue=cert.is_corrected_reissue,
        supersedes_certificate_id=cert.supersedes_certificate_id,
        is_revoked=cert.is_revoked,
        revoked_reason=cert.revoked_reason,
        created_at=cert.created_at,
    )


@router.post("/issue", response_model=CertificateOut, status_code=status.HTTP_201_CREATED)
def issue_certificate(
    payload: CertificateIssueRequest,
    current_user: User = Depends(require_roles(UserRole.ORGANIZATION)),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    if org.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only verified organizations can issue official certificates",
        )

    tpl = None
    if payload.template_id:
        tpl = (
            db.query(CertificateTemplate)
            .filter(CertificateTemplate.id == payload.template_id, CertificateTemplate.organization_id == org.id)
            .first()
        )
        if not tpl:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    cert_uid = f"CFX-{uuid.uuid4().hex[:10].upper()}"
    verification_url = f"{settings.FRONTEND_URL}/verify/{cert_uid}"
    rel_pdf_path = f"certificates/{cert_uid}.pdf"
    abs_pdf_path = settings.PRIVATE_STORAGE_DIR / rel_pdf_path
    logo_abs = (settings.PRIVATE_STORAGE_DIR / org.logo_path) if org.logo_path else None

    generate_certificate_pdf(
        output_path=abs_pdf_path,
        certificate_uid=cert_uid,
        organization_name=org.name,
        recipient_name=payload.recipient_name.strip(),
        title=payload.title.strip(),
        issue_date_str=payload.issue_date.isoformat(),
        verification_url=verification_url,
        header_title=tpl.header_title if tpl else "CERTIFICATE OF ACHIEVEMENT",
        body_template=tpl.body_template if tpl else "This is to certify that {recipient_name} has successfully completed {course_or_title} on {issue_date}.",
        primary_color=tpl.primary_color if tpl else "#1E3A8A",
        accent_color=tpl.accent_color if tpl else "#7C3AED",
        signatory_name=tpl.signatory_name if tpl else None,
        signatory_title=tpl.signatory_title if tpl else None,
        grade_or_score=payload.grade_or_score,
        logo_path=logo_abs,
    )

    cert = Certificate(
        certificate_uid=cert_uid,
        organization_id=org.id,
        template_id=tpl.id if tpl else None,
        category_id=payload.category_id or (tpl.category_id if tpl else None),
        recipient_name=payload.recipient_name.strip(),
        recipient_email=payload.recipient_email,
        title=payload.title.strip(),
        description=payload.description,
        issue_date=payload.issue_date,
        expiry_date=payload.expiry_date,
        grade_or_score=payload.grade_or_score,
        metadata_json=payload.metadata_json,
        pdf_path=rel_pdf_path,
        qr_code_data=verification_url,
        issued_by_user_id=current_user.id,
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    log_audit_event(
        db,
        action="CERTIFICATE_ISSUED",
        resource_type="certificate",
        resource_id=cert.certificate_uid,
        actor=current_user,
        description=f"Issued certificate {cert.certificate_uid} to {cert.recipient_name}",
    )
    return _to_cert_out(cert, db)


@router.get("/", response_model=list[CertificateOut])
def list_certificates(
    search: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Certificate)
    if current_user.role == UserRole.ORGANIZATION:
        org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
        if not org:
            return []
        query = query.filter(Certificate.organization_id == org.id)
    elif current_user.role == UserRole.PUBLIC_USER:
        query = query.filter(Certificate.recipient_email == current_user.email)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            (Certificate.certificate_uid.ilike(term))
            | (Certificate.recipient_name.ilike(term))
            | (Certificate.title.ilike(term))
        )
    certs = query.order_by(Certificate.created_at.desc()).limit(200).all()
    return [_to_cert_out(c, db) for c in certs]


@router.get("/{certificate_uid}", response_model=CertificateOut)
def get_certificate_details(certificate_uid: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.certificate_uid == certificate_uid).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    return _to_cert_out(cert, db)


@router.get("/{certificate_uid}/download")
def download_certificate_pdf(certificate_uid: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.certificate_uid == certificate_uid).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    pdf_file = resolve_private_path(cert.pdf_path)
    return FileResponse(
        path=pdf_file,
        media_type="application/pdf",
        filename=f"{cert.certificate_uid}.pdf",
    )


@router.post("/{certificate_uid}/revoke", response_model=CertificateOut)
def revoke_certificate(
    certificate_uid: str,
    reason: str = "Revoked by issuing authority",
    current_user: User = Depends(require_roles(UserRole.ORGANIZATION, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    cert = db.query(Certificate).filter(Certificate.certificate_uid == certificate_uid).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")

    if current_user.role == UserRole.ORGANIZATION:
        org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
        if not org or cert.organization_id != org.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to revoke this certificate")

    cert.is_revoked = True
    cert.revoked_reason = reason
    db.commit()
    db.refresh(cert)

    log_audit_event(
        db,
        action="CERTIFICATE_REVOKED",
        resource_type="certificate",
        resource_id=cert.certificate_uid,
        actor=current_user,
        description=f"Revoked certificate {cert.certificate_uid}: {reason}",
    )
    return _to_cert_out(cert, db)
