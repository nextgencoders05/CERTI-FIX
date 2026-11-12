import os
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configure isolated test environment before importing app
_tmp_dir = tempfile.mkdtemp(prefix="certifix_test_")
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_dir}/test.db"
os.environ["PRIVATE_STORAGE_DIR"] = f"{_tmp_dir}/private_storage"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest-only"
os.environ["DEBUG"] = "true"

from app.database.base import Base  # noqa: E402
from app.database.session import get_db  # noqa: E402
from app.main import app, seed_default_categories  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402
from app.security.auth import hash_password  # noqa: E402

engine = create_engine(os.environ["DATABASE_URL"], connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    seed_default_categories()
    db = TestingSessionLocal()
    try:
        if not db.query(User).filter(User.email == "admin@certifix.ai").first():
            admin = User(
                email="admin@certifix.ai",
                full_name="Super Admin",
                hashed_password=hash_password("AdminPass123!"),
                role=UserRole.SUPER_ADMIN,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
