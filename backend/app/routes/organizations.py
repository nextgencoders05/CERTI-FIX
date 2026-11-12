from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.organization import Organization, VerificationStatus
from app.models.user import User, UserRole
from app.schemas.organization import OrganizationOut, OrganizationUpdateRequest
from app.security.auth import require_roles
from app.security.file_security import resolve_private_path, validate_upload_file
from app.services.audit_service import log_audit_event
from app.services.storage_service import save_private_file

router = APIRouter(prefix="/organizations", tags=["Organizations"])


def _to_org_out(org: Organization) -> OrganizationOut:
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


@router.get("/", response_model=list[OrganizationOut])
def list_verified_organizations(db: Session = Depends(get_db)):
    orgs = (
        db.query(Organization)
        .filter(Organization.verification_status == VerificationStatus.VERIFIED)
        .order_by(Organization.name.asc())
        .all()
    )
    return [_to_org_out(o) for o in orgs]


@router.get("/me", response_model=OrganizationOut)
def get_my_organization(
    current_user: User = Depends(require_roles(UserRole.ORGANIZATION)),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization profile not found")
    return _to_org_out(org)


@router.put("/me", response_model=OrganizationOut)
def update_my_organization(
    payload: OrganizationUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.ORGANIZATION)),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization profile not found")

    for field in ("name", "registration_number", "domain", "website", "contact_email", "address", "description"):
        val = getattr(payload, field)
        if val is not None:
            setattr(org, field, val.strip() if isinstance(val, str) else val)

    db.commit()
    db.refresh(org)
    log_audit_event(
        db,
        action="ORGANIZATION_UPDATED",
        resource_type="organization",
        resource_id=str(org.id),
        actor=current_user,
        description=f"Organization profile updated: {org.name}",
    )
    return _to_org_out(org)


@router.post("/me/logo", response_model=OrganizationOut)
async def upload_organization_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(UserRole.ORGANIZATION)),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization profile not found")

    content, ext, _mime, _sha = await validate_upload_file(file, allowed_exts=["png", "jpg", "jpeg"])
    rel_path = save_private_file(content, "logos", ext)
    org.logo_path = rel_path
    db.commit()
    db.refresh(org)
    return _to_org_out(org)


@router.get("/{org_id}/logo")
def get_organization_logo(org_id: int, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org or not org.logo_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Logo not found")
    path = resolve_private_path(org.logo_path)
    return FileResponse(path)
