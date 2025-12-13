from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import router
from app.core.settings import settings

app = FastAPI(
    title="Bill Splitter",
    description="A small utility to split bills amongst friends",
)

app.add_middleware(
    CORSMiddleware,  # type: ignore
    allow_origins=settings.CORS_ALLOW_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")
