import re
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models.category import CertificateCategory
from app.routes import api_router
from app.security.rate_limiter import limiter

settings = get_settings()

DEFAULT_CATEGORIES = [
    ("Internship Certificate", "Certificates awarded upon completion of academic or industry internships."),
    ("Course Completion Certificate", "Certificates for completing structured courses or online programs."),
    ("Experience Certificate", "Official employment or tenure experience certificates."),
    ("Workshop Certificate", "Certificates for attending technical or professional workshops."),
    ("Training Certificate", "Certificates for specialized skills or corporate training programs."),
    ("Achievement Certificate", "Awards for merit, competitions, or academic/professional excellence."),
    ("Participation Certificate", "Certificates recognizing participation in events, hackathons, or seminars."),
    ("Other Certificates", "General official certificates not covered by standard categories."),
]


def seed_default_categories() -> None:
    db = SessionLocal()
    try:
        for name, desc in DEFAULT_CATEGORIES:
            slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
            exists = db.query(CertificateCategory).filter(CertificateCategory.slug == slug).first()
            if not exists:
                db.add(
                    CertificateCategory(
                        name=name,
                        slug=slug,
                        description=desc,
                        is_default=True,
                        is_active=True,
                    )
                )
        db.commit()
    finally:
        db.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        description="AI-Powered Certificate Management, OCR Recognition & Authorized Correction Platform",
    )

    app.state.limiter = limiter

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def safe_exception_handler(_request: Request, exc: Exception):
        if settings.DEBUG:
            return JSONResponse(status_code=500, content={"detail": str(exc)})
        return JSONResponse(status_code=500, content={"detail": "An unexpected internal error occurred."})

    @app.on_event("startup")
    def on_startup():
        Base.metadata.create_all(bind=engine)
        seed_default_categories()

    @app.get("/health", tags=["Health"])
    def health_check():
        return {"status": "healthy", "service": settings.APP_NAME}

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    return app


app = create_app()
