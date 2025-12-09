from fastapi import APIRouter

from app.schemas.outing import Outing, OutingSplit, Payment, PaymentPlan
from app.services.outing import (
    calculate_balance,
    calculate_outing_split_with_minimal_transactions,
)

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

    balance = calculate_balance(outing)
    print(balance)
    outing_split = calculate_outing_split_with_minimal_transactions(balance)

    return outing_split
