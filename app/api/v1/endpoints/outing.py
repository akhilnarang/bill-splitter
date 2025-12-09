from fastapi import APIRouter

from app.schemas.outing import Outing, OutingSplit, Payment, PaymentPlan

router = APIRouter()


@router.post("/split")
async def split(outing: Outing) -> OutingSplit:
    # Dummy data
    split = OutingSplit(
        payment_plans=[
            PaymentPlan(
                name="Jane Doe",
                payments=[
                    Payment(to="John Smith", amount=100),
                    Payment(to="Joe Shmoe", amount=200),
                ],
            ),
            PaymentPlan(
                name="Jane Doe",
                payments=[
                    Payment(to="John Smith", amount=300),
                ],
            ),
        ]
    )

    return split
