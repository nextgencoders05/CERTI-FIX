from typing import Any, Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.models.user import User


def log_audit_event(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    actor: Optional[User] = None,
    details: Optional[dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    description: Optional[str] = None,
) -> AuditLog:
    entry = AuditLog(
        actor_id=actor.id if actor else None,
        actor_email=actor.email if actor else None,
        actor_role=actor.role.value if actor else None,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        details=details,
        ip_address=ip_address,
        description=description,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
