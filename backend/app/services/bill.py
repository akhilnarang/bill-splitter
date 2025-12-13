from google import genai
from google.genai import types

from app.core.settings import settings
from app.schemas.bill import OCRBill
from app.services import gemini

BILL_OCR_PROMPT = """
You are an expert at extracting information from bills and receipts.
Your task is to analyze the provided image of a bill and extract the following information in JSON format:

Extract a Bill object with the following structure:
- items: A list of items, where each item contains:
  - name: The name of the item (string, non-empty)
  - price: The price of the item (float, must be positive)
  - quantity: The quantity ordered (integer, must be positive)
- tax_rate: The tax rate applied to the bill as a decimal (float, between 0.0 and 1.0, default is 0.0 if not found)
- service_charge: The service charge as a decimal (float, between 0.0 and 1.0, default is 0.0 if not found)

Important notes:
- Do NOT include the "paid_by" field in your response
- Do NOT include the "consumed_by" field in your response
- Extract only the items that appear on the bill
- Calculate tax_rate and service_charge from the bill if visible, otherwise use defaults
- Ensure all extracted values match the specified types and constraints
- Return the response as valid JSON that matches the Bill schema (excluding paid_by and consumed_by)

Please analyze the bill image and extract the information now.
"""


GENERATE_CONTENT_CONFIG = types.GenerateContentConfig(
    response_mime_type="application/json",
    response_schema=genai.types.Schema(
        type=genai.types.Type.OBJECT,
        properties={
            "tax_rate": genai.types.Schema(
                type=genai.types.Type.NUMBER,
            ),
            "service_charge": genai.types.Schema(
                type=genai.types.Type.NUMBER,
            ),
            "items": genai.types.Schema(
                type=genai.types.Type.ARRAY,
                items=genai.types.Schema(
                    type=genai.types.Type.OBJECT,
                    properties={
                        "name": genai.types.Schema(
                            type=genai.types.Type.STRING,
                        ),
                        "price": genai.types.Schema(
                            type=genai.types.Type.NUMBER,
                        ),
                        "quantity": genai.types.Schema(
                            type=genai.types.Type.NUMBER,
                        ),
                    },
                ),
            ),
        },
    ),
)


def get_bill_details_from_image(image_bytes: bytes, mime_type: str) -> OCRBill:
    if settings.GEMINI_API_KEY:
        bill_data = gemini.generate_content_from_image(
            prompt=BILL_OCR_PROMPT,
            image_bytes=image_bytes,
            mime_type=mime_type,
        )
    else:
        raise ValueError("API key is not set in settings for any LLM.")

    return OCRBill.model_validate_json(bill_data)
