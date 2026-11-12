import re
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.organization import Organization, VerificationStatus
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, OrganizationRegisterRequest, TokenResponse, UserRegisterRequest
from app.security.auth import create_access_token, get_current_user, hash_password, verify_password
from app.security.rate_limiter import get_client_ip, limiter
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "org"


def _user_dict(user: User, db: Session) -> dict:
    org = db.query(Organization).filter(Organization.owner_id == user.id).first()
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "phone": user.phone,
        "is_active": user.is_active,
        "organization_id": org.id if org else None,
        "organization_name": org.name if org else None,
        "organization_status": org.verification_status.value if org else None,
    }


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
def register_public_user(
    request: Request,
    payload: UserRegisterRequest,
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
        role=UserRole.PUBLIC_USER,
        phone=payload.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit_event(
        db,
        action="USER_REGISTERED",
        resource_type="user",
        resource_id=str(user.id),
        actor=user,
        ip_address=get_client_ip(request),
        description=f"Public user registered: {user.email}",
    )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token, user=_user_dict(user, db))


@router.post("/register-organization", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register_organization(
    request: Request,
    payload: OrganizationRegisterRequest,
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    base_slug = _slugify(payload.organization_name)
    slug = base_slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        counter += 1
        slug = f"{base_slug}-{counter}"

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
        role=UserRole.ORGANIZATION,
    )
    db.add(user)
    db.flush()

    org = Organization(
        owner_id=user.id,
        name=payload.organization_name.strip(),
        slug=slug,
        registration_number=payload.registration_number,
        domain=payload.domain,
        website=payload.website,
        contact_email=payload.contact_email.lower(),
        address=payload.address,
        description=payload.description,
        verification_status=VerificationStatus.PENDING,
    )
    db.add(org)
    db.commit()
    db.refresh(user)
    db.refresh(org)

    log_audit_event(
        db,
        action="ORGANIZATION_REGISTERED",
        resource_type="organization",
        resource_id=str(org.id),
        actor=user,
        ip_address=get_client_ip(request),
        description=f"Organization registered (pending verification): {org.name}",
    )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token, user=_user_dict(user, db))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
def login(
    request: Request,
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated",
        )

    log_audit_event(
        db,
        action="USER_LOGIN",
        resource_type="user",
        resource_id=str(user.id),
        actor=user,
        ip_address=get_client_ip(request),
        description=f"User logged in: {user.email}",
    )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token, user=_user_dict(user, db))


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _user_dict(current_user, db)
