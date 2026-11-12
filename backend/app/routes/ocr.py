from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database.session import get_db
from app.models.certificate import UploadedCertificate
from app.models.correction import CorrectionRequest
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.ocr.extractor import run_ocr_on_file
from app.schemas.certificate import UploadedCertificateOut
from app.security.auth import get_current_user
from app.security.file_security import resolve_private_path, validate_upload_file
from app.security.rate_limiter import get_client_ip, limiter
from app.services.audit_service import log_audit_event
from app.services.storage_service import save_private_file

settings = get_settings()
router = APIRouter(prefix="/ocr", tags=["OCR & Uploads"])


@router.post("/upload", response_model=UploadedCertificateOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("15/minute")
async def upload_and_extract_certificate(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content, ext, mime_type, sha256_hex = await validate_upload_file(file)
    rel_path = save_private_file(content, "uploads", ext)
    abs_path = settings.PRIVATE_STORAGE_DIR / rel_path

    upload_record = UploadedCertificate(
        uploader_id=current_user.id,
        original_filename=file.filename or f"upload.{ext}",
        stored_path=rel_path,
        mime_type=mime_type,
        file_size_bytes=len(content),
        file_sha256=sha256_hex,
        ocr_status="processing",
        retention_expires_at=datetime.now(timezone.utc) + timedelta(days=settings.UPLOAD_RETENTION_DAYS),
    )
    db.add(upload_record)
    db.commit()
    db.refresh(upload_record)

    try:
        ocr_result = run_ocr_on_file(abs_path, mime_type)
        upload_record.ocr_raw_text = ocr_result["raw_text"]
        upload_record.ocr_extracted_fields = ocr_result["extracted_fields"]
        upload_record.ocr_confidence = ocr_result["confidence"]
        upload_record.ocr_status = "completed"
    except Exception as exc:
        upload_record.ocr_status = "failed"
        upload_record.ocr_extracted_fields = {
            "error": "OCR processing encountered an error. You may still submit manual correction details.",
            "disclaimer": "OCR results are automated extractions and do not constitute proof of certificate authenticity.",
        }
        upload_record.ocr_raw_text = str(exc)

    db.commit()
    db.refresh(upload_record)

    log_audit_event(
        db,
        action="CERTIFICATE_UPLOADED_OCR",
        resource_type="uploaded_certificate",
        resource_id=str(upload_record.id),
        actor=current_user,
        ip_address=get_client_ip(request),
        description=f"Uploaded file '{upload_record.original_filename}' (OCR status: {upload_record.ocr_status})",
    )
    return upload_record


@router.get("/uploads", response_model=list[UploadedCertificateOut])
def list_my_uploads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(UploadedCertificate)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(UploadedCertificate.uploader_id == current_user.id)
    return query.order_by(UploadedCertificate.created_at.desc()).limit(100).all()


@router.get("/uploads/{upload_id}", response_model=UploadedCertificateOut)
def get_upload_detail(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload = db.query(UploadedCertificate).filter(UploadedCertificate.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Uploaded certificate not found")

    if current_user.role == UserRole.PUBLIC_USER and upload.uploader_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this upload")
    if current_user.role == UserRole.ORGANIZATION:
        org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
        linked_req = (
            db.query(CorrectionRequest)
            .filter(
                CorrectionRequest.uploaded_certificate_id == upload.id,
                CorrectionRequest.organization_id == (org.id if org else -1),
            )
            .first()
        )
        if not linked_req and upload.uploader_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this upload")

    return upload


@router.get("/uploads/{upload_id}/file")
def download_private_upload(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload = db.query(UploadedCertificate).filter(UploadedCertificate.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Uploaded certificate not found")

    if current_user.role == UserRole.PUBLIC_USER and upload.uploader_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == UserRole.ORGANIZATION:
        org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
        linked_req = (
            db.query(CorrectionRequest)
            .filter(
                CorrectionRequest.uploaded_certificate_id == upload.id,
                CorrectionRequest.organization_id == (org.id if org else -1),
            )
            .first()
        )
        if not linked_req and upload.uploader_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    file_path = resolve_private_path(upload.stored_path)
    return FileResponse(path=file_path, media_type=upload.mime_type, filename=upload.original_filename)
