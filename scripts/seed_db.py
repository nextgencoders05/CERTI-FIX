"""
Development seed script for CertiFix AI.
Creates an initial Super Admin account and default certificate categories.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.main import seed_default_categories
from app.models.user import User, UserRole
from app.security.auth import hash_password


def main():
    Base.metadata.create_all(bind=engine)
    seed_default_categories()
    db = SessionLocal()
    try:
        admin_email = "admin@certifix.ai"
        if not db.query(User).filter(User.email == admin_email).first():
            admin = User(
                email=admin_email,
                full_name="Platform Super Admin",
                hashed_password=hash_password("ChangeMeAdmin123!"),
                role=UserRole.SUPER_ADMIN,
            )
            db.add(admin)
            db.commit()
            print(f"Created Super Admin: {admin_email} (please change password immediately)")
        else:
            print("Super Admin already exists.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
