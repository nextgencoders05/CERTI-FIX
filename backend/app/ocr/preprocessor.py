import cv2
import numpy as np
from PIL import Image


def preprocess_image_for_ocr(pil_image: Image.Image) -> Image.Image:
    """
    Applies OpenCV preprocessing to improve Tesseract OCR accuracy on certificate scans:
    1. Convert to RGB -> Grayscale
    2. Upscale small images (< 1200px wide)
    3. Denoise with bilateral filter
    4. Contrast enhancement via CLAHE
    """
    rgb = np.array(pil_image.convert("RGB"))
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)

    height, width = gray.shape[:2]
    if width < 1200:
        scale = 1200.0 / max(width, 1)
        gray = cv2.resize(
            gray,
            (int(width * scale), int(height * scale)),
            interpolation=cv2.INTER_CUBIC,
        )

    denoised = cv2.bilateralFilter(gray, d=5, sigmaColor=50, sigmaSpace=50)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    # Light Otsu thresholding if background is uneven
    _, thresh = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return Image.fromarray(thresh)
