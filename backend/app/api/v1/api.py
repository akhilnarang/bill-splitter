from fastapi import APIRouter

from app.api.v1.endpoints.bill import router as bills_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.outing import router as outings_router

router = APIRouter()

router.include_router(health_router, prefix="/health", tags=["Health"])
router.include_router(outings_router, prefix="/outings", tags=["Outings"])
router.include_router(bills_router, prefix="/bills", tags=["Bills"])
