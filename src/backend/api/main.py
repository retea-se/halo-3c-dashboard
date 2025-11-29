"""
Halo 3C Dashboard - FastAPI Backend
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import sensors, events, auth, system, beacons
from .websocket import router as websocket_router

app = FastAPI(
    title="Halo 3C Dashboard API",
    description="Backend API for Halo 3C Smart Sensor Dashboard",
    version="1.0.0"
)

# CORS middleware - konfigureras för frontend
# Läs tillåtna origins från miljövariabel (kommaseparerad lista)
allowed_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sensors.router, prefix="/api/sensors", tags=["sensors"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(system.router, prefix="/api/system", tags=["system"])
app.include_router(beacons.router, prefix="/api/beacons", tags=["beacons"])
app.include_router(websocket_router, tags=["websocket"])


@app.get("/")
async def root():
    return {"message": "Halo 3C Dashboard API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
