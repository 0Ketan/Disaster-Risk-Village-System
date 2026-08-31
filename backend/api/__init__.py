"""
FastAPI API Routers.
"""

from .health import router as health_router
from .endpoints import router as api_router
from .sync import router as sync_router

__all__ = ["health_router", "api_router", "sync_router"]
