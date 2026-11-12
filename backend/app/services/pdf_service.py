import io
from pathlib import Path
from typing import Optional

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode import qr as rl_qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

try:
    import qrcode
except ImportError:  # pragma: no cover
    qrcode = None


def _hex_to_color(hex_str: str, fallback: str = "#1E3A8A") -> colors.Color:
    try:
        return colors.HexColor(hex_str)
    except Exception:
        return colors.HexColor(fallback)


def _draw_qr_code(c: canvas.Canvas, data: str, x: float, y: float, size: float = 82.0) -> None:
    if qrcode is not None:
        qr_img = qrcode.make(data)
        buf = io.BytesIO()
        qr_img.save(buf, format="PNG")
        buf.seek(0)
        c.drawImage(ImageReader(buf), x, y, width=size, height=size)
        return

    qr_widget = rl_qr.QrCodeWidget(data)
    bounds = qr_widget.getBounds()
    w = bounds[2] - bounds[0]
    h = bounds[3] - bounds[1]
    d = Drawing(size, size, transform=[size / w, 0, 0, size / h, 0, 0])
    d.add(qr_widget)
    renderPDF.draw(d, c, x, y)


def generate_certificate_pdf(
    output_path: Path,
    certificate_uid: str,
    organization_name: str,
    recipient_name: str,
    title: str,
    issue_date_str: str,
    verification_url: str,
    header_title: str = "CERTIFICATE OF ACHIEVEMENT",
    body_template: str = "This is to certify that {recipient_name} has successfully completed {course_or_title} on {issue_date}.",
    primary_color: str = "#1E3A8A",
    accent_color: str = "#7C3AED",
    signatory_name: Optional[str] = None,
    signatory_title: Optional[str] = None,
    grade_or_score: Optional[str] = None,
    logo_path: Optional[Path] = None,
    is_corrected_reissue: bool = False,
) -> Path:
    """Generates an official landscape A4 PDF certificate with QR verification code."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    page_w, page_h = landscape(A4)
    c = canvas.Canvas(str(output_path), pagesize=(page_w, page_h))
    c.setTitle(f"{title} - {recipient_name} ({certificate_uid})")

    primary = _hex_to_color(primary_color, "#1E3A8A")
    accent = _hex_to_color(accent_color, "#7C3AED")

    # Background & Double Border
    c.setFillColor(colors.white)
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    c.setStrokeColor(primary)
    c.setLineWidth(4)
    c.rect(24, 24, page_w - 48, page_h - 48, fill=0, stroke=1)

    c.setStrokeColor(accent)
    c.setLineWidth(1.5)
    c.rect(34, 34, page_w - 68, page_h - 68, fill=0, stroke=1)

    # Top accent bar
    c.setFillColor(primary)
    c.rect(34, page_h - 54, page_w - 68, 20, fill=1, stroke=0)

    # Organization Logo
    if logo_path and logo_path.exists():
        try:
            c.drawImage(
                str(logo_path),
                60,
                page_h - 140,
                width=72,
                height=72,
                preserveAspectRatio=True,
                mask="auto",
            )
        except Exception:
            pass

    # Organization Name
    c.setFillColor(primary)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(page_w / 2, page_h - 95, organization_name.upper())

    if is_corrected_reissue:
        c.setFillColor(accent)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(page_w / 2, page_h - 114, "OFFICIAL CORRECTED RE-ISSUE")

    # Header Title
    c.setFillColor(colors.HexColor("#111827"))
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(page_w / 2, page_h - 155, header_title.upper())

    # Divider line
    c.setStrokeColor(accent)
    c.setLineWidth(2)
    c.line(page_w / 2 - 140, page_h - 170, page_w / 2 + 140, page_h - 170)

    # Intro
    c.setFillColor(colors.HexColor("#4B5563"))
    c.setFont("Helvetica", 13)
    c.drawCentredString(page_w / 2, page_h - 205, "This credential is proudly presented to")

    # Recipient Name
    c.setFillColor(primary)
    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(page_w / 2, page_h - 248, recipient_name)

    # Title / Body text
    formatted_body = body_template.format(
        recipient_name=recipient_name,
        course_or_title=title,
        issue_date=issue_date_str,
        organization_name=organization_name,
    )
    c.setFillColor(colors.HexColor("#1F2937"))
    c.setFont("Helvetica", 13)
    # Simple 2-line wrap if long
    if len(formatted_body) > 90:
        split_idx = formatted_body.rfind(" ", 0, 90)
        if split_idx == -1:
            split_idx = 90
        c.drawCentredString(page_w / 2, page_h - 292, formatted_body[:split_idx].strip())
        c.drawCentredString(page_w / 2, page_h - 312, formatted_body[split_idx:].strip())
    else:
        c.drawCentredString(page_w / 2, page_h - 295, formatted_body)

    if grade_or_score:
        c.setFillColor(accent)
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(page_w / 2, page_h - 338, f"Result / Grade: {grade_or_score}")

    # Footer metadata & Signature
    c.setFillColor(colors.HexColor("#374151"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(64, 108, f"Issue Date: {issue_date_str}")
    c.setFont("Helvetica", 10)
    c.drawString(64, 90, f"Certificate ID: {certificate_uid}")
    c.drawString(64, 74, f"Verify at: {verification_url}")

    # Signatory block
    sig_x = page_w / 2 - 60
    c.setStrokeColor(colors.HexColor("#9CA3AF"))
    c.setLineWidth(1)
    c.line(sig_x, 105, sig_x + 180, 105)
    c.setFillColor(colors.HexColor("#111827"))
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(sig_x + 90, 90, signatory_name or "Authorized Signatory")
    c.setFillColor(colors.HexColor("#6B7280"))
    c.setFont("Helvetica", 9.5)
    c.drawCentredString(sig_x + 90, 76, signatory_title or organization_name)

    # QR Code on bottom right
    _draw_qr_code(c, verification_url, page_w - 142, 62, size=80.0)
    c.setFillColor(colors.HexColor("#6B7280"))
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(page_w - 102, 50, "Scan to Verify")

    c.showPage()
    c.save()
    return output_path
