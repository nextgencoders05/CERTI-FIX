import io
import re
from pathlib import Path
from typing import Any
import pytesseract
from PIL import Image

from app.core.config import get_settings
from app.ocr.preprocessor import preprocess_image_for_ocr

settings = get_settings()
pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover
    fitz = None

try:
    from pdf2image import convert_from_bytes
except ImportError:  # pragma: no cover
    convert_from_bytes = None


CATEGORY_KEYWORDS = {
    "Internship Certificate": ["internship", "intern"],
    "Course Completion Certificate": ["course completion", "completed the course", "online course", "curriculum"],
    "Experience Certificate": ["experience", "worked as", "employment", "tenure"],
    "Workshop Certificate": ["workshop", "bootcamp", "hands-on session"],
    "Training Certificate": ["training", "trained in", "industrial training"],
    "Achievement Certificate": ["achievement", "excellence", "merit", "first place", "winner", "honors"],
    "Participation Certificate": ["participation", "participated in", "attended"],
}


def _pdf_bytes_to_images(pdf_bytes: bytes) -> list[Image.Image]:
    if fitz is not None:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        images: list[Image.Image] = []
        for page_idx in range(min(len(doc), 3)):
            page = doc.load_page(page_idx)
            pix = page.get_pixmap(dpi=200)
            images.append(Image.open(io.BytesIO(pix.tobytes("png"))))
        return images
    if convert_from_bytes is not None:
        return convert_from_bytes(pdf_bytes, dpi=200, first_page=1, last_page=3)
    raise RuntimeError("No PDF rasterization library (PyMuPDF or pdf2image) is available")


def extract_certificate_fields(raw_text: str) -> dict[str, Any]:
    """Parses raw OCR text into structured certificate fields using regex and heuristics."""
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    joined = "\n".join(lines)

    # 1. Certificate ID
    cert_id = None
    id_patterns = [
        r"\b(CFX-[A-Z0-9-]{4,30})\b",
        r"\b(CERT-[A-Z0-9-]{4,30})\b",
        r"(?:Certificate\s*(?:ID|No\.?|Number)|Credential\s*ID)\s*[:#-]?\s*([A-Z0-9-]{5,40})",
    ]
    for pat in id_patterns:
        m = re.search(pat, joined, re.IGNORECASE)
        if m:
            cert_id = m.group(1).strip()
            break

    # 2. Recipient Name
    recipient_name = None
    name_patterns = [
        r"(?:this\s+is\s+to\s+certify\s+that|awarded\s+to|presented\s+to|conferred\s+upon)\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3})",
        r"(?:Recipient|Name)\s*[:\-]\s*([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3})",
    ]
    for pat in name_patterns:
        m = re.search(pat, joined, re.IGNORECASE)
        if m:
            candidate = m.group(1).strip()
            # Stop at common trailing prepositions if captured
            candidate = re.split(r"\b(?:has|for|in|on|with|from)\b", candidate, maxsplit=1)[0].strip()
            if len(candidate) >= 3:
                recipient_name = candidate
                break

    # 3. Issue Date
    issue_date = None
    date_patterns = [
        r"\b(\d{4}-\d{2}-\d{2})\b",
        r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b",
        r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b",
        r"\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b",
    ]
    for pat in date_patterns:
        m = re.search(pat, joined, re.IGNORECASE)
        if m:
            issue_date = m.group(1).strip()
            break

    # 4. Course or Title
    course_or_title = None
    title_patterns = [
        r"(?:successfully\s+completed(?:\s+the)?|completed\s+the|for\s+completing)\s+([^\n.]{4,100})",
        r"(?:Course|Program|Workshop|Training|Title)\s*[:\-]\s*([^\n]{4,100})",
    ]
    for pat in title_patterns:
        m = re.search(pat, joined, re.IGNORECASE)
        if m:
            course_or_title = m.group(1).strip(" .,-")
            break

    # 5. Organization Name (heuristic: first non-generic header line or 'issued by')
    organization_name = None
    org_match = re.search(r"(?:issued\s+by|organized\s+by|from)\s+([A-Z][A-Za-z0-9&.,\s-]{3,60})", joined, re.IGNORECASE)
    if org_match:
        organization_name = org_match.group(1).strip(" .,-")
    elif lines:
        for line in lines[:4]:
            if "certificate" not in line.lower() and len(line) > 3:
                organization_name = line[:80]
                break

    # 6. Category Guess
    category_guess = "Other Certificates"
    lower_text = joined.lower()
    for cat_name, kws in CATEGORY_KEYWORDS.items():
        if any(kw in lower_text for kw in kws):
            category_guess = cat_name
            break

    return {
        "certificate_id": cert_id,
        "recipient_name": recipient_name,
        "course_or_title": course_or_title,
        "issue_date": issue_date,
        "organization_name": organization_name,
        "category_guess": category_guess,
        "disclaimer": "OCR results are automated extractions and do not constitute proof of certificate authenticity.",
    }


def run_ocr_on_file(file_path: Path, mime_type: str) -> dict[str, Any]:
    """Runs preprocessing + Tesseract OCR on an uploaded PDF or image file."""
    raw_bytes = file_path.read_bytes()
    if mime_type == "application/pdf":
        images = _pdf_bytes_to_images(raw_bytes)
    else:
        images = [Image.open(io.BytesIO(raw_bytes))]

    all_text_parts: list[str] = []
    confidences: list[float] = []

    for img in images:
        processed = preprocess_image_for_ocr(img)
        data = pytesseract.image_to_data(processed, output_type=pytesseract.Output.DICT)
        words = []
        for txt, conf in zip(data.get("text", []), data.get("conf", [])):
            txt_clean = (txt or "").strip()
            try:
                conf_val = float(conf)
            except (TypeError, ValueError):
                conf_val = -1.0
            if txt_clean:
                words.append(txt_clean)
            if conf_val >= 0:
                confidences.append(conf_val)
        page_text = pytesseract.image_to_string(processed).strip()
        if not page_text and words:
            page_text = " ".join(words)
        if page_text:
            all_text_parts.append(page_text)

    raw_text = "\n\n".join(all_text_parts).strip()
    avg_confidence = round(sum(confidences) / len(confidences), 2) if confidences else 0.0
    extracted_fields = extract_certificate_fields(raw_text)

    return {
        "raw_text": raw_text,
        "extracted_fields": extracted_fields,
        "confidence": avg_confidence,
        "page_count": len(images),
    }
