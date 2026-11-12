import uuid
from pathlib import Path
from app.core.config import get_settings

settings = get_settings()


def save_private_file(content: bytes, category: str, extension: str) -> str:
    """
    Saves bytes to PRIVATE_STORAGE_DIR/<category>/<uuid>.<ext>.
    Returns the relative path for database persistence.
    """
    if category not in {"uploads", "certificates", "logos"}:
        raise ValueError(f"Invalid storage category: {category}")
    filename = f"{uuid.uuid4().hex}.{extension.lstrip('.')}"
    rel_path = f"{category}/{filename}"
    abs_path = settings.PRIVATE_STORAGE_DIR / rel_path
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    abs_path.write_bytes(content)
    return rel_path
