"""
FastAPI Application Entry for Disaster Risk Village System (VillageShield).
Configured with CORS middleware, centralized routers, and resilient error handlers.
"""

import os
import sys
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add project root to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.api.health import router as health_router
from backend.api.endpoints import router as api_router

logger = logging.getLogger("villageshield")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Disaster Risk Village System (VillageShield)",
    version="1.0.0",
    description="AI-powered disaster risk assessment and safe relocation platform for Himalayan rural settlements.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler to ensure server stability
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal Server Error encountered, resilient degradation active",
            "detail": str(exc),
            "_source": "fallback"
        }
    )

# Include API Routers
app.include_router(health_router)
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "system": "Disaster Risk Village System (VillageShield)",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "api_health": "/api/health",
        "villages": "/api/villages",
        "summary": "/api/dashboard/summary"
    }
