"""
API Routes للقياسات، المستخدمين، الأعراض، والتنبيهات
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional, List
import uuid

from app.db.database import get_db
from app.models.models import User, HealthProfile, Measurement, DailySymptom, Alert
from app.api.routes.auth import get_current_user
from app.services.withings_service import withings_service

router = APIRouter()


# ─── Schemas ─────────────────────────────────────────────────────────────────

class HealthProfileUpdate(BaseModel):
    is_pregnant: Optional[bool] = None
    pregnancy_week: Optional[int] = None
    pregnancy_start_date: Optional[str] = None
    pre_pregnancy_weight: Optional[float] = None
    has_kidney_disease: Optional[bool] = None
    on_dialysis: Optional[bool] = None
    dry_weight_kg: Optional[float] = None
    dialysis_days: Optional[List[str]] = None
    has_diabetes: Optional[bool] = None
    diabetes_type: Optional[str] = None
    has_hypertension: Optional[bool] = None
    has_heart_disease: Optional[bool] = None
    target_weight: Optional[float] = None
    activity_level: Optional[str] = None
    medications: Optional[List[str]] = None
    has_health_goal: Optional[bool] = None  # frontend-only — not stored in DB

    model_config = {"extra": "ignore"}


class SymptomCreate(BaseModel):
    symptom_date: str  # YYYY-MM-DD
    headache_level: Optional[int] = None
    swelling_level: Optional[int] = None
    swelling_location: Optional[List[str]] = None  # face, hands, feet, legs
    nausea_level: Optional[int] = None
    vomiting_count: Optional[int] = 0
    blurred_vision: Optional[bool] = False
    upper_abdominal_pain: Optional[bool] = False
    light_sensitivity: Optional[bool] = False
    fatigue_level: Optional[int] = None
    shortness_of_breath: Optional[bool] = False
    dizziness: Optional[bool] = False
    chest_pain: Optional[bool] = False
    hypoglycemia_episode: Optional[bool] = False
    hyperglycemia_episode: Optional[bool] = False
    decreased_urination: Optional[bool] = False
    leg_cramps: Optional[bool] = False
    mood: Optional[str] = None
    sleep_hours: Optional[float] = None
    water_intake_liters: Optional[float] = None
    notes: Optional[str] = None


# ─── Helper ──────────────────────────────────────────────────────────────────

async def sync_historical_measurements(user: User, db: AsyncSession, days_back: int = 90):
    """جلب القياسات التاريخية من Withings"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days_back)
        measurements = await withings_service.get_measurements(
            access_token=user.withings_access_token,
            start_date=start_date,
        )
        
        for m_data in measurements:
            # تجنب التكرار
            existing = await db.execute(
                select(Measurement).where(
                    Measurement.user_id == user.id,
                    Measurement.measured_at == m_data["measured_at"],
                )
            )
            if existing.scalar_one_or_none():
                continue
            
            bmi = None
            if m_data.get("weight_kg") and user.height_cm:
                h_m = user.height_cm / 100
                bmi = round(m_data["weight_kg"] / (h_m ** 2), 1)
            
            new_m = Measurement(
                user_id=user.id,
                measured_at=m_data["measured_at"],
                weight_kg=m_data.get("weight_kg"),
                bmi=bmi,
                fat_ratio=m_data.get("fat_ratio"),
                fat_mass_kg=m_data.get("fat_mass_kg"),
                water_ratio=m_data.get("water_ratio"),
                muscle_mass_kg=m_data.get("muscle_mass_kg"),
                bone_mass_kg=m_data.get("bone_mass_kg"),
                heart_rate=m_data.get("heart_rate"),
                raw_data=m_data.get("raw_data"),
                source="withings_sync",
            )
            db.add(new_m)
        
        await db.flush()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Historical sync error: {e}")