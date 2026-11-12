from fastapi import APIRouter
from app.routes import (
    admin,
    auth,
    categories,
    certificates,
    corrections,
    notifications,
    ocr,
    organizations,
    templates,
    users,
    verification,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(organizations.router)
api_router.include_router(categories.router)
api_router.include_router(templates.router)
api_router.include_router(certificates.router)
api_router.include_router(ocr.router)
api_router.include_router(corrections.router)
api_router.include_router(verification.router)
api_router.include_router(admin.router)
api_router.include_router(notifications.router)
