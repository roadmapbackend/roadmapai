from fastapi import APIRouter
from app.api.v1.endpoints import roadmap, billing

api_router = APIRouter()

api_router.include_router(roadmap.router, prefix="/roadmap", tags=["Roadmap.ai Engine"])
api_router.include_router(billing.router, prefix="/billing", tags=["Billing & Quotas"])
