# CertiFix AI Architecture

## System Overview

CertiFix AI separates **AI-assisted intake** from **official credential authority**:

1. **Public User Intake & OCR**: Users upload PDF/PNG/JPEG files into private storage (`PRIVATE_STORAGE_DIR/uploads/`). OpenCV preprocesses the image (upscaling, bilateral denoising, CLAHE, Otsu thresholding) and Tesseract OCR extracts raw text and structured fields (`certificate_id`, `recipient_name`, `course_or_title`, `issue_date`, `organization_name`, `category_guess`). OCR output is explicitly flagged as non-authoritative.
2. **Correction Request Routing**: Users review OCR fields and submit a `CorrectionRequest` targeting a verified `Organization`.
3. **Issuer-Only Approval & Official Re-Issuance**: Only the verified issuing `Organization` can approve or reject requests. Approval generates a brand-new official PDF via ReportLab with a new `CFX-...` Credential ID, organization logo, signatory block, and embedded QR code pointing to `/verify/<certificate_uid>`, while recording an immutable `ApprovalRecord` and `AuditLog`.
4. **Security**: Private file storage (never exposed via public static directories), magic-byte + extension validation, path-traversal protection, JWT authentication, role-based access control (`public_user`, `organization`, `super_admin`), and rate limiting.
