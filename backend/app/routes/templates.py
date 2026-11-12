from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.organization import Organization, VerificationStatus
from app.models.template import CertificateTemplate
from app.models.user import User, UserRole
from app.schemas.template import TemplateCreateRequest, TemplateOut, TemplateUpdateRequest
from app.security.auth import require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/templates", tags=["Certificate Templates"])


def _get_org_for_user(db: Session, user: User) -> Organization:
    org = db.query(Organization).filter(Organization.owner_id == user.id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org


@router.get("/", response_model=list[TemplateOut])
def list_my_templates(
    current_user: User = Depends(require_roles(UserRole.ORGANIZATION)),
    db: Session = Depends(get_db),
):
    org = _get_org_for_user(db, current_user)
    return (
        db.query(CertificateTemplate)
        .filter(CertificateTemplate.organization_id == org.id)
        .order_by(CertificateTemplate.created_at.desc())
        .all()
    )


@router.post("/", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
def create_template(
    payload: TemplateCreateRequest,
    current_user: User = Depends(require_roles(UserRole.ORGANIZATION)),
    db: Session = Depends(get_db),
):
    org = _get_org_for_user(db, current_user)
    if org.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization must be verified before creating certificate templates",
        )

    tpl = CertificateTemplate(
        organization_id=org.id,
        category_id=payload.category_id,
        name=payload.name.strip(),
        description=payload.description,
        layout_style=payload.layout_style,
        primary_color=payload.primary_color,
        accent_color=payload.accent_color,
        header_title=payload.header_title,
        body_template=payload.body_template,
        signatory_name=payload.signatory_name,
        signatory_title=payload.signatory_title,
        layout_config=payload.layout_config,
    )
    db.add(tpl)
    db.commit()
    db.refresh(tpl)

    log_audit_event(
        db,
        action="TEMPLATE_CREATED",
        resource_type="certificate_template",
        resource_id=str(tpl.id),
        actor=current_user,
        description=f"Template '{tpl.name}' created by {org.name}",
    )
    return tpl


@router.put("/{template_id}", response_model=TemplateOut)
def update_template(
    template_id: int,
    payload: TemplateUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.ORGANIZATION)),
    db: Session = Depends(get_db),
):
    org = _get_org_for_user(db, current_user)
    tpl = (
        db.query(CertificateTemplate)
        .filter(CertificateTemplate.id == template_id, CertificateTemplate.organization_id == org.id)
        .first()
    )
    if not tpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    for field, val in payload.dict(exclude_unset=True).items():
        setattr(tpl, field, val)
    db.commit()
    db.refresh(tpl)
    return tpl


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    current_user: User = Depends(require_roles(UserRole.ORGANIZATION)),
    db: Session = Depends(get_db),
):
    org = _get_org_for_user(db, current_user)
    tpl = (
        db.query(CertificateTemplate)
        .filter(CertificateTemplate.id == template_id, CertificateTemplate.organization_id == org.id)
        .first()
    )
    if not tpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    db.delete(tpl)
    db.commit()
    return None
