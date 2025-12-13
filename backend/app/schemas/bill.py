from pydantic import BaseModel, Field


class OCRBillItem(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(gt=0.0)
    quantity: int = Field(gt=0)


class OCRBill(BaseModel):
    items: list[OCRBillItem]
    tax_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    service_charge: float = Field(default=0.0, ge=0.0, le=1.0)
