import hashlib
from pathlib import Path
from typing import Tuple
from fastapi import HTTPException, UploadFile, status
from app.core.config import get_settings

settings = get_settings()

MAGIC_SIGNATURES = {
    b"%PDF-": "application/pdf",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"\xff\xd8\xff": "image/jpeg",
}

ALLOWED_MIME_TYPES = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
}


async def validate_upload_file(file: UploadFile, allowed_exts: list[str] | None = None) -> Tuple[bytes, str, str, str]:
    """
    Validates file extension, magic bytes, and size limit.
    Returns (content_bytes, safe_ext, detected_mime, sha256_hex).
    """
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is required")

    ext = Path(file.filename).suffix.lower().lstrip(".")
    valid_exts = allowed_exts or settings.ALLOWED_UPLOAD_EXTENSIONS
    if ext not in valid_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '.{ext}'. Allowed: {', '.join(valid_exts)}",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB} MB",
        )

    detected_mime = None
    for magic, mime in MAGIC_SIGNATURES.items():
        if content.startswith(magic):
            detected_mime = mime
            break

    if detected_mime is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match a valid PDF, PNG, or JPEG signature",
        )

    expected_mime = ALLOWED_MIME_TYPES.get(ext)
    if expected_mime and detected_mime != expected_mime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File extension does not match actual file content",
        )

    sha256_hex = hashlib.sha256(content).hexdigest()
    return content, ext, detected_mime, sha256_hex


def resolve_private_path(relative_path: str) -> Path:
    """Safely resolves a stored relative path inside PRIVATE_STORAGE_DIR, preventing path traversal."""
    base = settings.PRIVATE_STORAGE_DIR.resolve()
    target = (base / relative_path).resolve()
    if not str(target).startswith(str(base)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid file path")
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored file not found")
    return target
