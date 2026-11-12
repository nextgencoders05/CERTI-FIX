import uuid
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database.session import get_db
from app.models.certificate import Certificate, UploadedCertificate
from app.models.correction import ApprovalRecord, CorrectionRequest, CorrectionStatus
from app.models.organization import Organization, VerificationStatus
from app.models.template import CertificateTemplate
from app.models.user import User, UserRole
from app.schemas.correction import (
    ApprovalRecordOut,
    CorrectionCreateRequest,
    CorrectionDecisionRequest,
    CorrectionRequestOut,
)
from app.security.auth import get_current_user, require_roles
from app.security.rate_limiter import get_client_ip
from app.services.audit_service import log_audit_event
from app.services.notification_service import create_notification
from app.services.pdf_service import generate_certificate_pdf

settings = get_settings()
router = APIRouter(prefix="/corrections", tags=["Correction Requests"])


def _to_correction_out(req: CorrectionRequest, db: Session) -> CorrectionRequestOut:
    requester = db.query(User).filter(User.id == req.requester_id).first()
    org = db.query(Organization).filter(Organization.id == req.organization_id).first()
    corrected_cert = (
        db.query(Certificate).filter(Certificate.id == req.corrected_certificate_id).first()
        if req.corrected_certificate_id
        else None
    )
    approvals = (
        db.query(ApprovalRecord)
        .filter(ApprovalRecord.correction_request_id == req.id)
        .order_by(ApprovalRecord.created_at.desc())
        .all()
    )
    return CorrectionRequestOut(
        id=req.id,
        request_code=req.request_code,
        requester_id=req.requester_id,
        requester_name=requester.full_name if requester else None,
        organization_id=req.organization_id,
        organization_name=org.name if org else None,
        uploaded_certificate_id=req.uploaded_certificate_id,
        original_certificate_id=req.original_certificate_id,
        corrected_certificate_id=req.corrected_certificate_id,
        corrected_certificate_uid=corrected_cert.certificate_uid if corrected_cert else None,
        claimed_certificate_uid=req.claimed_certificate_uid,
        original_extracted_data=req.original_extracted_data,
        requested_changes=req.requested_changes,
        reason=req.reason,
        supporting_notes=req.supporting_notes,
        status=req.status.value,
        reviewer_notes=req.reviewer_notes,
        reviewed_at=req.reviewed_at,
        created_at=req.created_at,
        approval_records=[ApprovalRecordOut.from_orm(a) for a in approvals],
    )


@router.post("/", response_model=CorrectionRequestOut, status_code=status.HTTP_201_CREATED)
def submit_correction_request(
    request: Request,
    payload: CorrectionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == payload.organization_id).first()
    if not org or org.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target organization must be a verified issuing organization",
        )

    upload = (
        db.query(UploadedCertificate)
        .filter(
            UploadedCertificate.id == payload.uploaded_certificate_id,
            UploadedCertificate.uploader_id == current_user.id,
        )
        .first()
    )
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded certificate not found for current user",
        )

    original_cert = None
    if payload.claimed_certificate_uid:
        original_cert = (
            db.query(Certificate)
            .filter(
                Certificate.certificate_uid == payload.claimed_certificate_uid.strip(),
                Certificate.organization_id == org.id,
            )
            .first()
        )

    req_code = f"CRQ-{uuid.uuid4().hex[:8].upper()}"
    corr = CorrectionRequest(
        request_code=req_code,
        requester_id=current_user.id,
        organization_id=org.id,
        uploaded_certificate_id=upload.id,
        original_certificate_id=original_cert.id if original_cert else None,
        claimed_certificate_uid=payload.claimed_certificate_uid,
        original_extracted_data=upload.ocr_extracted_fields,
        requested_changes=payload.requested_changes,
        reason=payload.reason.strip(),
        supporting_notes=payload.supporting_notes,
        status=CorrectionStatus.PENDING,
    )
    db.add(corr)
    db.commit()
    db.refresh(corr)

    create_notification(
        db,
        user_id=org.owner_id,
        title="New Certificate Correction Request",
        message=f"{current_user.full_name} submitted correction request {corr.request_code}.",
        category="correction",
        link=f"/org/corrections",
    )

    log_audit_event(
        db,
        action="CORRECTION_REQUEST_SUBMITTED",
        resource_type="correction_request",
        resource_id=corr.request_code,
        actor=current_user,
        ip_address=get_client_ip(request),
        description=f"Submitted correction request {corr.request_code} to {org.name}",
    )
    return _to_correction_out(corr, db)


@router.get("/", response_model=list[CorrectionRequestOut])
def list_correction_requests(
    status_filter: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(CorrectionRequest)
    if current_user.role == UserRole.PUBLIC_USER:
        query = query.filter(CorrectionRequest.requester_id == current_user.id)
    elif current_user.role == UserRole.ORGANIZATION:
        org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
        if not org:
            return []
        query = query.filter(CorrectionRequest.organization_id == org.id)

    if status_filter:
        try:
            st = CorrectionStatus(status_filter)
            query = query.filter(CorrectionRequest.status == st)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter")

    reqs = query.order_by(CorrectionRequest.created_at.desc()).limit(200).all()
    return [_to_correction_out(r, db) for r in reqs]


@router.get("/{request_id}", response_model=CorrectionRequestOut)
def get_correction_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = db.query(CorrectionRequest).filter(CorrectionRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Correction request not found")

    if current_user.role == UserRole.PUBLIC_USER and req.requester_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == UserRole.ORGANIZATION:
        org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
        if not org or req.organization_id != org.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return _to_correction_out(req, db)


@router.post("/{request_id}/decide", response_model=CorrectionRequestOut)
def decide_correction_request(
    request_id: int,
    request: Request,
    payload: CorrectionDecisionRequest,
    current_user: User = Depends(require_roles(UserRole.ORGANIZATION)),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not org or org.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only verified issuing organizations can approve or reject correction requests",
        )

    corr = (
        db.query(CorrectionRequest)
        .filter(CorrectionRequest.id == request_id, CorrectionRequest.organization_id == org.id)
        .first()
    )
    if not corr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Correction request not found")
    if corr.status in (CorrectionStatus.APPROVED, CorrectionStatus.REJECTED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Correction request has already been {corr.status.value}",
        )

    decision = payload.decision.lower().strip()
    if decision not in {"approved", "rejected"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Decision must be 'approved' or 'rejected'")

    now = datetime.now(timezone.utc)
    corr.reviewed_by_id = current_user.id
    corr.reviewed_at = now
    corr.reviewer_notes = payload.reviewer_notes

    new_cert_uid = None
    if decision == "approved":
        corr.status = CorrectionStatus.APPROVED

        tpl = None
        if payload.template_id:
            tpl = (
                db.query(CertificateTemplate)
                .filter(CertificateTemplate.id == payload.template_id, CertificateTemplate.organization_id == org.id)
                .first()
            )
        if not tpl:
            tpl = (
                db.query(CertificateTemplate)
                .filter(CertificateTemplate.organization_id == org.id, CertificateTemplate.is_active.is_(True))
                .first()
            )

        changes = corr.requested_changes or {}
        orig_data = corr.original_extracted_data or {}
        requester = db.query(User).filter(User.id == corr.requester_id).first()

        recipient_name = (
            changes.get("recipient_name")
            or orig_data.get("recipient_name")
            or (requester.full_name if requester else "Recipient")
        )
        title = changes.get("course_or_title") or changes.get("title") or orig_data.get("course_or_title") or "Certificate"
        raw_date = changes.get("issue_date") or orig_data.get("issue_date")
        try:
            issue_dt = date.fromisoformat(str(raw_date)) if raw_date else date.today()
        except ValueError:
            issue_dt = date.today()

        new_cert_uid = f"CFX-{uuid.uuid4().hex[:10].upper()}"
        verification_url = f"{settings.FRONTEND_URL}/verify/{new_cert_uid}"
        rel_pdf_path = f"certificates/{new_cert_uid}.pdf"
        abs_pdf_path = settings.PRIVATE_STORAGE_DIR / rel_pdf_path
        logo_abs = (settings.PRIVATE_STORAGE_DIR / org.logo_path) if org.logo_path else None

        generate_certificate_pdf(
            output_path=abs_pdf_path,
            certificate_uid=new_cert_uid,
            organization_name=org.name,
            recipient_name=str(recipient_name).strip(),
            title=str(title).strip(),
            issue_date_str=issue_dt.isoformat(),
            verification_url=verification_url,
            header_title=tpl.header_title if tpl else "CERTIFICATE OF ACHIEVEMENT",
            body_template=tpl.body_template if tpl else "This is to certify that {recipient_name} has successfully completed {course_or_title} on {issue_date}.",
            primary_color=tpl.primary_color if tpl else "#1E3A8A",
            accent_color=tpl.accent_color if tpl else "#7C3AED",
            signatory_name=tpl.signatory_name if tpl else None,
            signatory_title=tpl.signatory_title if tpl else None,
            grade_or_score=changes.get("grade_or_score"),
            logo_path=logo_abs,
            is_corrected_reissue=True,
        )

        new_cert = Certificate(
            certificate_uid=new_cert_uid,
            organization_id=org.id,
            template_id=tpl.id if tpl else None,
            category_id=tpl.category_id if tpl else None,
            recipient_name=str(recipient_name).strip(),
            recipient_email=requester.email if requester else None,
            title=str(title).strip(),
            issue_date=issue_dt,
            grade_or_score=changes.get("grade_or_score"),
            pdf_path=rel_pdf_path,
            qr_code_data=verification_url,
            is_corrected_reissue=True,
            supersedes_certificate_id=corr.original_certificate_id,
            issued_by_user_id=current_user.id,
        )
        db.add(new_cert)
        db.flush()
        corr.corrected_certificate_id = new_cert.id

        approval = ApprovalRecord(
            correction_request_id=corr.id,
            organization_id=org.id,
            decided_by_user_id=current_user.id,
            decision="approved",
            decision_notes=payload.reviewer_notes,
            new_certificate_uid=new_cert_uid,
            snapshot_before=orig_data,
            snapshot_after=changes,
        )
        db.add(approval)

        create_notification(
            db,
            user_id=corr.requester_id,
            title="Correction Approved & Certificate Re-issued",
            message=f"Your request {corr.request_code} was approved. New Certificate ID: {new_cert_uid}",
            category="success",
            link="/user/corrections",
        )
    else:
        corr.status = CorrectionStatus.REJECTED
        approval = ApprovalRecord(
            correction_request_id=corr.id,
            organization_id=org.id,
            decided_by_user_id=current_user.id,
            decision="rejected",
            decision_notes=payload.reviewer_notes,
            snapshot_before=corr.original_extracted_data,
            snapshot_after=corr.requested_changes,
        )
        db.add(approval)

        create_notification(
            db,
            user_id=corr.requester_id,
            title="Correction Request Rejected",
            message=f"Your request {corr.request_code} was rejected by {org.name}.",
            category="warning",
            link="/user/corrections",
        )

    db.commit()
    db.refresh(corr)

    log_audit_event(
        db,
        action=f"CORRECTION_{decision.upper()}",
        resource_type="correction_request",
        resource_id=corr.request_code,
        actor=current_user,
        ip_address=get_client_ip(request),
        details={"new_certificate_uid": new_cert_uid} if new_cert_uid else None,
        description=f"Correction {corr.request_code} {decision} by {org.name}",
    )
    return _to_correction_out(corr, db)
