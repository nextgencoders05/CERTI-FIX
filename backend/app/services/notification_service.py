from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    category: str = "info",
    link: Optional[str] = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        category=category,
        link=link,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
