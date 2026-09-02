"""
FastAPI Application Entry for Disaster Risk Village System (VillageShield).
Configured with CORS middleware, centralized routers, and resilient error handlers.
"""

import os
import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import threading
import time as _time

# Add project root to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.api.health import router as health_router
from backend.api.endpoints import router as api_router
from backend.api.sync import router as sync_router
from contextlib import asynccontextmanager

from backend.engines.dynamic_risk_engine import (
    recalculate_all_villages_dynamic,
    refresh_dynamic_state,
    get_last_updated_time,
    load_baseline_from_csv,
    LAST_UPDATED_TIME,
    seed_baseline_from_csv,
)
from backend.data_loader import villages_csv_path

logger = logging.getLogger("villageshield")
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    summary = load_baseline_from_csv()
    logger.info(
        f"Startup complete: {summary['villages_loaded']} villages seeded from {summary['csv_path']}"
    )
    yield


app = FastAPI(
    title="Disaster Risk Village System (VillageShield)",
    version="1.0.0",
    description="AI-powered disaster risk assessment and safe relocation platform for Himalayan rural settlements.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
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

# Include API Routers (sync_router first so /villages/dynamic and /refresh take precedence)
app.include_router(health_router)
app.include_router(sync_router)
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
        "summary": "/api/dashboard/summary",
        "refresh": "/api/refresh",
        "sync_weather": "/api/sync-weather",
        "sync_status": "/api/sync-status",
        "dynamic_villages": "/api/villages/dynamic",
        "last_updated": get_last_updated_time(),
    }

