import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.ocr.extractor import extract_certificate_fields, run_ocr_on_file  # noqa: E402
from app.services.pdf_service import generate_certificate_pdf  # noqa: E402


class CoreEnginesTestCase(unittest.TestCase):
    def test_pdf_generation_and_ocr_roundtrip(self):
        with tempfile.TemporaryDirectory() as tmp:
            pdf_path = Path(tmp) / "CFX-TEST12345.pdf"
            out = generate_certificate_pdf(
                output_path=pdf_path,
                certificate_uid="CFX-TEST12345",
                organization_name="CertiFix Demo University",
                recipient_name="Priya Nair",
                title="Full Stack AI Engineering",
                issue_date_str="2026-11-12",
                verification_url="http://localhost:5173/verify/CFX-TEST12345",
                signatory_name="Dr. R. Menon",
                signatory_title="Dean of Academics",
                grade_or_score="Distinction (96%)",
                is_corrected_reissue=True,
            )
            self.assertTrue(out.exists())
            data = out.read_bytes()
            self.assertTrue(data.startswith(b"%PDF-"))
            self.assertGreater(len(data), 1500)

            # Run real Tesseract + OpenCV + pdf2image OCR on the generated PDF
            ocr_result = run_ocr_on_file(pdf_path, "application/pdf")
            self.assertGreater(len(ocr_result["raw_text"]), 20)
            self.assertIn("Priya Nair", ocr_result["raw_text"])
            self.assertEqual(ocr_result["extracted_fields"]["certificate_id"], "CFX-TEST12345")
            self.assertIn("disclaimer", ocr_result["extracted_fields"])

    def test_field_extraction_heuristics(self):
        sample_text = (
            "National Tech Academy\n"
            "INTERNSHIP CERTIFICATE\n"
            "This is to certify that Karthik Subramanian has successfully completed the\n"
            "Cloud Architecture Internship on 2026-10-15.\n"
            "Certificate ID: CFX-998877AA\n"
        )
        fields = extract_certificate_fields(sample_text)
        self.assertEqual(fields["certificate_id"], "CFX-998877AA")
        self.assertEqual(fields["recipient_name"], "Karthik Subramanian")
        self.assertEqual(fields["issue_date"], "2026-10-15")
        self.assertEqual(fields["category_guess"], "Internship Certificate")

    def test_png_image_ocr(self):
        with tempfile.TemporaryDirectory() as tmp:
            img_path = Path(tmp) / "sample_cert.png"
            img = Image.new("RGB", (900, 400), color=(255, 255, 255))
            draw = ImageDraw.Draw(img)
            draw.text((60, 80), "CERTIFIX ACADEMY", fill=(0, 0, 0))
            draw.text((60, 140), "Awarded to Meera Krishnan", fill=(0, 0, 0))
            draw.text((60, 200), "Certificate ID: CFX-PNG1234", fill=(0, 0, 0))
            img.save(img_path, format="PNG")

            ocr_result = run_ocr_on_file(img_path, "image/png")
            self.assertIn("Meera", ocr_result["raw_text"])


if __name__ == "__main__":
    unittest.main()
