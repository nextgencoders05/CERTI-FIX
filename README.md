# CertiFix AI – AI-Powered Certificate Management & Correction Platform

CertiFix AI is a full-stack certificate management, AI/OCR extraction, and authorized correction platform built with **React + Vite + Tailwind CSS**, **FastAPI + SQLAlchemy + PostgreSQL + Alembic**, and **Tesseract OCR + OpenCV + ReportLab**.

## Key Features

- **Role-Based Portals**: Public User, Issuing Organization, and Super Admin dashboards.
- **AI/OCR Extraction**: OpenCV image preprocessing + Tesseract OCR + PyMuPDF/pdf2image PDF rasterization with structured field extraction.
- **Authorized Correction Workflow**: Users submit correction requests; only verified issuing organizations can approve/reject and re-issue official PDFs with new Credential IDs.
- **Official PDF & QR Generation**: Landscape A4 PDFs with organization logos, custom template colors, signatories, and scannable QR verification codes.
- **Public Verification**: Instant verification by Certificate ID or QR code with revocation status and audit logging.
- **Security**: JWT authentication, password hashing, private file storage (no public upload URLs), magic-byte validation, rate limiting, and audit logs.

## Quick Start (Docker Compose)

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API & Swagger Docs: `http://localhost:8000/docs`

## Local Development Setup

### 1. Backend (FastAPI + PostgreSQL)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Update DATABASE_URL and SECRET_KEY in .env
alembic upgrade head
python ../scripts/seed_db.py
uvicorn app.main:app --reload --port 8000
```

> **System Prerequisites**: Install `tesseract-ocr` and `poppler-utils` on your OS for OCR and PDF rasterization.

### 2. Frontend (React + Vite + Tailwind CSS)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Running Tests

```bash
cd backend
pytest -v
# Or standalone core OCR & PDF engine tests:
python3 -m unittest tests/test_core_engines.py -v
```

## GitHub Readiness

- All secrets are excluded via `.gitignore` and `.env.example` templates are provided.
- `private_storage/`, `node_modules/`, and `.venv/` are excluded.
