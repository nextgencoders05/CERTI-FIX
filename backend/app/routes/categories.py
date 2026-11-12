import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.category import CertificateCategory
from app.models.user import User, UserRole
from app.schemas.category import CategoryCreateRequest, CategoryOut, CategoryUpdateRequest
from app.security.auth import require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/categories", tags=["Certificate Categories"])


@router.get("/", response_model=list[CategoryOut])
def list_categories(include_inactive: bool = False, db: Session = Depends(get_db)):
    query = db.query(CertificateCategory)
    if not include_inactive:
        query = query.filter(CertificateCategory.is_active.is_(True))
    return query.order_by(CertificateCategory.id.asc()).all()


@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreateRequest,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    slug = re.sub(r"[^a-z0-9]+", "-", payload.name.lower()).strip("-")
    existing = (
        db.query(CertificateCategory)
        .filter((CertificateCategory.name == payload.name.strip()) | (CertificateCategory.slug == slug))
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists")

    cat = CertificateCategory(
        name=payload.name.strip(),
        slug=slug,
        description=payload.description,
        is_default=False,
        is_active=True,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)

    log_audit_event(
        db,
        action="CATEGORY_CREATED",
        resource_type="category",
        resource_id=str(cat.id),
        actor=current_user,
        description=f"Added category: {cat.name}",
    )
    return cat


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    cat = db.query(CertificateCategory).filter(CertificateCategory.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if payload.name is not None:
        cat.name = payload.name.strip()
        cat.slug = re.sub(r"[^a-z0-9]+", "-", cat.name.lower()).strip("-")
    if payload.description is not None:
        cat.description = payload.description
    if payload.is_active is not None:
        cat.is_active = payload.is_active

    db.commit()
    db.refresh(cat)
    return cat
