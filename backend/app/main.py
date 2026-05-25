from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.routes import auth, users, measurements, symptoms, alerts, webhooks, analysis
from app.core.config import settings
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Smart Scale Health API",
    description="Withings Body Smart integration with AI health analysis",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(measurements.router, prefix="/api/measurements", tags=["Measurements"])
app.include_router(symptoms.router, prefix="/api/symptoms", tags=["Symptoms"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["AI Analysis"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
