"""
Webhook Handler
يستقبل القياسات فور حدوثها من Withings ويشغّل التحليل
"""
from fastapi import APIRouter, Request, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import logging

from app.db.database import get_db
from app.models.models import User, Measurement, Alert, HealthProfile, DailySymptom
from app.services.withings_service import withings_service
from app.analysis.pregnancy_analyzer import pregnancy_analyzer
from app.analysis.kidney_analyzer import kidney_analyzer
from app.analysis.general_analyzer import general_analyzer, run_ai_analysis

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/withings/{user_id}")
async def receive_withings_webhook(
    user_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Withings يستدعي هذا endpoint فور اكتمال القياس
    """
    body = await request.form()
    logger.info(f"Webhook received for user {user_id}: {dict(body)}")
    
    # Withings يرسل: userid, startdate, enddate, appli
    startdate = body.get("startdate")
    enddate = body.get("enddate")
    
    if not startdate:
        raise HTTPException(status_code=400, detail="Missing startdate")
    
    # جلب المستخدم
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.withings_access_token:
        raise HTTPException(status_code=404, detail="User not found or not connected")
    
    # Withings يحتاج رد 200 سريع، العمل الحقيقي في الخلفية
    background_tasks.add_task(
        process_new_measurements,
        user_id=str(user.id),
        access_token=user.withings_access_token,
        refresh_token=user.withings_refresh_token,
        startdate=int(startdate),
        enddate=int(enddate) if enddate else None,
        db=db,
    )
    
    return {"status": "ok"}


async def process_new_measurements(
    user_id: str,
    access_token: str,
    refresh_token: str,
    startdate: int,
    enddate: int,
    db: AsyncSession,
):
    """معالجة القياسات الجديدة وتشغيل التحليل"""
    try:
        from datetime import datetime, timezone
        
        start = datetime.fromtimestamp(startdate)
        end = datetime.fromtimestamp(enddate) if enddate else datetime.utcnow()
        
        # جلب القياسات من Withings
        measurements = await withings_service.get_measurements(
            access_token=access_token,
            start_date=start,
            end_date=end,
        )
        
        if not measurements:
            logger.info(f"No measurements received for user {user_id}")
            return
        
        # جلب الملف الصحي
        result = await db.execute(
            select(HealthProfile).where(HealthProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        
        # جلب القياسات السابقة (آخر 30 يوم)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        result = await db.execute(
            select(Measurement)
            .where(
                Measurement.user_id == user_id,
                Measurement.measured_at >= thirty_days_ago,
            )
            .order_by(Measurement.measured_at.desc())
            .limit(100)
        )
        history = result.scalars().all()
        history_dicts = [_measurement_to_dict(m) for m in history]
        
        # جلب أعراض اليوم
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0)
        result = await db.execute(
            select(DailySymptom)
            .where(
                DailySymptom.user_id == user_id,
                DailySymptom.symptom_date >= today_start,
            )
            .limit(1)
        )
        today_symptom = result.scalar_one_or_none()
        symptoms_dict = _symptom_to_dict(today_symptom) if today_symptom else None
        
        for measurement_data in measurements:
            # حفظ القياس
            new_measurement = Measurement(
                user_id=user_id,
                measured_at=measurement_data["measured_at"],
                weight_kg=measurement_data.get("weight_kg"),
                bmi=_calculate_bmi(measurement_data.get("weight_kg"), profile),
                fat_ratio=measurement_data.get("fat_ratio"),
                fat_mass_kg=measurement_data.get("fat_mass_kg"),
                water_ratio=measurement_data.get("water_ratio"),
                muscle_mass_kg=measurement_data.get("muscle_mass_kg"),
                bone_mass_kg=measurement_data.get("bone_mass_kg"),
                heart_rate=measurement_data.get("heart_rate"),
                raw_data=measurement_data.get("raw_data"),
                source="withings",
            )
            
            if profile and profile.is_pregnant and profile.pre_pregnancy_weight:
                new_measurement.pregnancy_weight_gain = (
                    (measurement_data.get("weight_kg") or 0) - profile.pre_pregnancy_weight
                )
            
            db.add(new_measurement)
            await db.flush()  # الحصول على ID
            
            # تشغيل التحليل
            profile_dict = _profile_to_dict(profile) if profile else {}
            current_dict = _measurement_to_dict(new_measurement)
            
            all_alerts = []
            
            # تحليل مخصص حسب الحالة الصحية
            if profile and profile.is_pregnant:
                preg_alerts = pregnancy_analyzer.analyze(
                    current_measurement=current_dict,
                    previous_measurements=history_dicts,
                    health_profile=profile_dict,
                    today_symptoms=symptoms_dict,
                )
                all_alerts.extend(preg_alerts)
            
            if profile and profile.has_kidney_disease:
                kidney_alerts = kidney_analyzer.analyze(
                    current_measurement=current_dict,
                    previous_measurements=history_dicts,
                    health_profile=profile_dict,
                    today_symptoms=symptoms_dict,
                )
                all_alerts.extend(kidney_alerts)
            
            # التحليل العام دائماً
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            user_dict = {"gender": user.gender if user else "male"}
            
            general_alerts = general_analyzer.analyze(
                current_measurement=current_dict,
                previous_measurements=history_dicts,
                health_profile={**profile_dict, **user_dict},
                today_symptoms=symptoms_dict,
            )
            all_alerts.extend(general_alerts)
            
            # حفظ التنبيهات
            alert_dicts = []
            for alert_result in all_alerts:
                if alert_result.score > 0 or alert_result.severity != "info":
                    db_alert = Alert(
                        user_id=user_id,
                        measurement_id=new_measurement.id,
                        alert_type=alert_result.alert_type,
                        severity=alert_result.severity,
                        title=alert_result.title,
                        message=alert_result.message,
                        recommendations=alert_result.recommendations,
                    )
                    db.add(db_alert)
                    alert_dicts.append({
                        "severity": alert_result.severity,
                        "title": alert_result.title,
                    })
            
            # التحليل الذكي بـ Claude
            user_result = await db.execute(select(User).where(User.id == user_id))
            user_obj = user_result.scalar_one_or_none()
            
            if user_obj:
                from dateutil.relativedelta import relativedelta
                age = None
                if user_obj.birthdate:
                    age = relativedelta(datetime.utcnow(), user_obj.birthdate).years
                
                user_full_dict = {
                    "name": user_obj.name,
                    "gender": user_obj.gender,
                    "age": age,
                    "height_cm": user_obj.height_cm,
                    "health_profile": profile_dict,
                }
                
                ai_text = await run_ai_analysis(
                    user_data=user_full_dict,
                    current_measurement=current_dict,
                    history=history_dicts[:7],  # آخر 7 قياسات
                    symptoms=symptoms_dict,
                    alerts=alert_dicts,
                )
                new_measurement.ai_analysis = ai_text
                new_measurement.ai_analyzed_at = datetime.utcnow()
        
        await db.commit()
        logger.info(f"Processed {len(measurements)} measurements for user {user_id}")
    
    except Exception as e:
        logger.error(f"Error processing measurements for user {user_id}: {e}", exc_info=True)
        await db.rollback()


def _calculate_bmi(weight_kg: float, profile) -> float:
    """حساب BMI من الوزن والطول"""
    if not weight_kg or not profile:
        return None
    # الطول محفوظ في User، نحتاج ربطه
    return None  # سيتم حسابه في الـ API route


def _measurement_to_dict(m: Measurement) -> dict:
    if not m:
        return {}
    return {
        "id": str(m.id),
        "measured_at": m.measured_at.isoformat() if m.measured_at else None,
        "weight_kg": m.weight_kg,
        "bmi": m.bmi,
        "fat_ratio": m.fat_ratio,
        "fat_mass_kg": m.fat_mass_kg,
        "water_ratio": m.water_ratio,
        "muscle_mass_kg": m.muscle_mass_kg,
        "bone_mass_kg": m.bone_mass_kg,
        "heart_rate": m.heart_rate,
        "pregnancy_weight_gain": m.pregnancy_weight_gain,
    }


def _profile_to_dict(p: HealthProfile) -> dict:
    if not p:
        return {}
    return {
        "is_pregnant": p.is_pregnant,
        "pregnancy_week": p.pregnancy_week,
        "pre_pregnancy_weight": p.pre_pregnancy_weight,
        "has_kidney_disease": p.has_kidney_disease,
        "on_dialysis": p.on_dialysis,
        "dry_weight_kg": p.dry_weight_kg,
        "last_dialysis_date": p.last_dialysis_date.isoformat() if p.last_dialysis_date else None,
        "has_diabetes": p.has_diabetes,
        "diabetes_type": p.diabetes_type,
        "has_hypertension": p.has_hypertension,
        "target_weight": p.target_weight,
    }


def _symptom_to_dict(s: DailySymptom) -> dict:
    if not s:
        return {}
    return {
        "headache_level": s.headache_level,
        "swelling_level": s.swelling_level,
        "swelling_location": s.swelling_location,
        "nausea_level": s.nausea_level,
        "blurred_vision": s.blurred_vision,
        "upper_abdominal_pain": s.upper_abdominal_pain,
        "light_sensitivity": s.light_sensitivity,
        "fatigue_level": s.fatigue_level,
        "shortness_of_breath": s.shortness_of_breath,
        "dizziness": s.dizziness,
        "chest_pain": s.chest_pain,
        "decreased_urination": s.decreased_urination,
    }
