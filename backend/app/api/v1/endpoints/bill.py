from webbrowser import get

from fastapi import APIRouter, UploadFile
from google.genai._interactions.types.content_start import Content

from app.schemas.bill import OCRBill
from app.services.bill import get_bill_details_from_image

router = APIRouter()


@router.post("/ocr")
async def extract_bill_details_from_image(file: UploadFile) -> OCRBill:
    """
    Extract bill details from an uploaded image file.
    """
    content_type = file.content_type
    if not content_type or not content_type.startswith("image/"):
        raise ValueError("Invalid file type. Please upload an image file.")

    with file.file as f:
        content = f.read()
        return get_bill_details_from_image(content, content_type)
