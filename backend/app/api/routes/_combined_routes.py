from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List

from app.db.database import get_db
from app.models.models import User, HealthProfile, Measurement, DailySymptom, Alert
from app.api.routes.auth import get_current_user
from app.api.routes.measurements import HealthProfileUpdate, SymptomCreate

router_users = APIRouter()
router_symptoms = APIRouter()
router_alerts = APIRouter()
router_analysis = APIRouter()


# ─── Users ───────────────────────────────────────────────────────────────────

@router_users.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "gender": current_user.gender,
        "birthdate": current_user.birthdate.isoformat() if current_user.birthdate else None,
        "height_cm": current_user.height_cm,
        "withings_connected": current_user.withings_connected,
        "health_profile": _profile_to_dict(profile),
    }


@router_users.put("/me/health-profile")
async def update_health_profile(
    data: HealthProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import math as _math
    from datetime import timedelta

    result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = HealthProfile(user_id=current_user.id)
        db.add(profile)

    # الحقول المسموح بتحديثها في قاعدة البيانات فقط
    db_fields = {
        "is_pregnant", "pregnancy_week", "pre_pregnancy_weight",
        "has_kidney_disease", "on_dialysis", "dry_weight_kg", "dialysis_days",
        "has_diabetes", "has_hypertension", "has_heart_disease",
        "target_weight", "activity_level", "medications",
    }

    raw = data.model_dump(exclude_none=True)

    # معالجة pregnancy_start_date بشكل منفصل
    if "pregnancy_start_date" in raw and raw["pregnancy_start_date"]:
        try:
            profile.pregnancy_start_date = datetime.strptime(raw["pregnancy_start_date"], "%Y-%m-%d")
            profile.expected_due_date = profile.pregnancy_start_date + timedelta(days=280)
        except (ValueError, TypeError):
            pass

    # معالجة diabetes_type بشكل منفصل (Enum)
    if "diabetes_type" in raw and raw["diabetes_type"] in ("type1", "type2", "gestational"):
        profile.diabetes_type = raw["diabetes_type"]

    # باقي الحقول
    for field in db_fields:
        if field not in raw:
            continue
        value = raw[field]
        # تجاهل NaN
        if isinstance(value, float) and _math.isnan(value):
            continue
        setattr(profile, field, value)

    profile.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(profile)

    return {"message": "تم تحديث الملف الصحي", "profile": _profile_to_dict(profile)}


def _calc_weight_stats(weights: list, label: str) -> dict | None:
    """حساب SD والإحصاءات لمجموعة قياسات وزن"""
    import math
    valid = [w for w in weights if w and w > 0]
    if len(valid) < 2:
        return None

    mean = sum(valid) / len(valid)
    variance = sum((w - mean) ** 2 for w in valid) / (len(valid) - 1)
    sd = math.sqrt(variance)
    cv = round((sd / mean) * 100, 1) if mean > 0 else None
    min_w = min(valid)
    max_w = max(valid)

    if sd < 0.5:
        stability, level = "مستقر جداً", "good"
    elif sd < 1.0:
        stability, level = "تذبذب طبيعي", "ok"
    elif sd < 2.0:
        stability, level = "يستحق المتابعة", "warning"
    else:
        stability, level = "تذبذب غير طبيعي", "danger"

    return {
        "period": label,
        "count": len(valid),
        "mean": round(mean, 2),
        "sd": round(sd, 3),
        "cv": cv,
        "min": round(min_w, 1),
        "max": round(max_w, 1),
        "range": round(max_w - min_w, 2),
        "stability": stability,
        "stability_level": level,
        "upper_band": round(mean + sd, 2),
        "lower_band": round(mean - sd, 2),
    }


@router_users.get("/me/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """بيانات لوحة التحكم الرئيسية"""

    # آخر قياس
    result = await db.execute(
        select(Measurement)
        .where(Measurement.user_id == current_user.id)
        .order_by(desc(Measurement.measured_at))
        .limit(1)
    )
    latest = result.scalar_one_or_none()

    # آخر 30 قياس للرسم البياني والإحصاءات
    result = await db.execute(
        select(Measurement)
        .where(Measurement.user_id == current_user.id)
        .order_by(desc(Measurement.measured_at))
        .limit(30)
    )
    history = result.scalars().all()

    # التنبيهات غير المقروءة
    result = await db.execute(
        select(Alert)
        .where(Alert.user_id == current_user.id, Alert.is_read == False)
        .order_by(desc(Alert.created_at))
        .limit(10)
    )
    unread_alerts = result.scalars().all()

    # الملف الصحي
    result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    # ── حساب SD ───────────────────────────────────────────────────────────
    all_weights = [m.weight_kg for m in history]
    weekly_weights  = all_weights[:7]
    monthly_weights = all_weights[:30]

    weekly_stats  = _calc_weight_stats(weekly_weights,  "آخر 7 أيام")
    monthly_stats = _calc_weight_stats(monthly_weights, "آخر 30 يوماً")

    # تنبيه خاص لمريض الكلى إذا تجاوز SD حد 1.5 كغ
    kidney_sd_alert = None
    if profile and profile.has_kidney_disease and weekly_stats and weekly_stats["sd"] > 1.5:
        kidney_sd_alert = {
            "type": "fluid_retention_sd",
            "severity": "critical",
            "message": f"تذبذب الوزن هذا الأسبوع (±{weekly_stats['sd']:.2f} كغ) يتجاوز الحد الآمن لمريض الكلى (1.5 كغ). راجع طبيبك.",
        }

    # تنبيه خاص للحامل إذا تجاوز SD حد 0.8 كغ
    pregnancy_sd_alert = None
    if profile and profile.is_pregnant and weekly_stats and weekly_stats["sd"] > 0.8:
        pregnancy_sd_alert = {
            "type": "pregnancy_weight_fluctuation",
            "severity": "warning",
            "message": f"تذبذب الوزن الأسبوعي (±{weekly_stats['sd']:.2f} كغ) غير طبيعي أثناء الحمل. أذكري ذلك لطبيبك.",
        }

    return {
        "latest_measurement": _measurement_to_dict(latest),
        "history": [_measurement_to_dict(m) for m in reversed(history)],
        "unread_alerts": [_alert_to_dict(a) for a in unread_alerts],
        "unread_count": len(unread_alerts),
        "health_profile": _profile_to_dict(profile),
        "withings_connected": current_user.withings_connected,
        "weight_stats": {
            "weekly":  weekly_stats,
            "monthly": monthly_stats,
        },
        "kidney_sd_alert":    kidney_sd_alert,
        "pregnancy_sd_alert": pregnancy_sd_alert,
    }



@router_users.get("/me/dialysis-session")
async def get_dialysis_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """بيانات جلسة الغسيل الكلوي"""
    result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile or not profile.on_dialysis:
        return {"on_dialysis": False}

    dry_weight = profile.dry_weight_kg
    dialysis_days = profile.dialysis_days or []

    result = await db.execute(
        select(Measurement)
        .where(Measurement.user_id == current_user.id)
        .order_by(desc(Measurement.measured_at))
        .limit(10)
    )
    recent = result.scalars().all()

    latest_weight = recent[0].weight_kg if recent else None
    latest_time   = recent[0].measured_at if recent else None

    fluid_kg  = round(latest_weight - dry_weight, 2) if (latest_weight and dry_weight) else None
    fluid_pct = round((fluid_kg / dry_weight) * 100, 1) if (fluid_kg and dry_weight) else None

    danger_level = "safe"
    danger_msg   = None
    if fluid_pct is not None:
        if fluid_pct >= 3.0:
            danger_level = "danger"
            danger_msg   = f"تراكمت {fluid_kg:.1f} كغ سوائل — تجاوزت 3% من وزنك الجاف. اتصل بمركز الغسيل فوراً."
        elif fluid_pct >= 2.0:
            danger_level = "warning"
            danger_msg   = f"تراكمت {fluid_kg:.1f} كغ سوائل — بين 2–3%. قلّل السوائل وراقب التورم."
        elif fluid_pct > 0:
            danger_level = "safe"
            danger_msg   = f"تراكمت {fluid_kg:.1f} كغ سوائل — ضمن الحد الآمن."
        else:
            danger_level = "low"
            danger_msg   = f"وزنك أقل من وزنك الجاف بـ {abs(fluid_kg):.1f} كغ."

    from datetime import date, timedelta
    day_map = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
        "Friday": 4, "Saturday": 5, "Sunday": 6,
        "الاثنين": 0, "الثلاثاء": 1, "الأربعاء": 2, "الخميس": 3,
        "الجمعة": 4, "السبت": 5, "الأحد": 6,
    }
    today_d = date.today()
    next_session_date = None
    days_until = None
    if dialysis_days:
        upcoming = []
        for d in dialysis_days:
            target = day_map.get(d)
            if target is not None:
                diff = (target - today_d.weekday()) % 7 or 7
                upcoming.append((diff, today_d + timedelta(days=diff)))
        if upcoming:
            upcoming.sort()
            days_until, next_session_date = upcoming[0]

    history = [
        {
            "measured_at": m.measured_at.isoformat(),
            "weight_kg": m.weight_kg,
            "fluid_kg": round(m.weight_kg - dry_weight, 2) if (m.weight_kg and dry_weight) else None,
        }
        for m in reversed(recent)
    ]

    return {
        "on_dialysis": True,
        "dry_weight_kg": dry_weight,
        "current_weight_kg": latest_weight,
        "last_measured_at": latest_time.isoformat() if latest_time else None,
        "fluid_accumulated_kg": fluid_kg,
        "fluid_pct": fluid_pct,
        "danger_level": danger_level,
        "danger_msg": danger_msg,
        "dialysis_days": dialysis_days,
        "next_session_date": next_session_date.isoformat() if next_session_date else None,
        "days_until_session": days_until,
        "last_dialysis_date": profile.last_dialysis_date.isoformat() if profile.last_dialysis_date else None,
        "history": history,
    }


@router_users.post("/me/dialysis-session/mark-done")
async def mark_dialysis_done(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """تسجيل إتمام جلسة الغسيل"""
    result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="الملف الصحي غير موجود")
    profile.last_dialysis_date = datetime.utcnow()
    profile.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "تم تسجيل جلسة الغسيل", "date": profile.last_dialysis_date.isoformat()}


class ReminderSettings(BaseModel):
    reminder_time: Optional[str] = None
    reminder_enabled: Optional[bool] = True

@router_users.put("/me/reminder")
async def update_reminder(
    data: ReminderSettings,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """حفظ إعدادات التذكير الصباحي"""
    import json as _json
    result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        profile = HealthProfile(user_id=current_user.id)
        db.add(profile)
    existing = {}
    try:
        if profile.notes:
            existing = _json.loads(profile.notes)
    except Exception:
        pass
    existing["reminder"] = {"time": data.reminder_time, "enabled": data.reminder_enabled}
    profile.notes = _json.dumps(existing, ensure_ascii=False)
    await db.commit()
    return {"message": "تم حفظ التذكير", "reminder": existing["reminder"]}


# ─── Symptoms ────────────────────────────────────────────────────────────────

@router_symptoms.post("/")
async def log_symptoms(
    data: SymptomCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    symptom_date = datetime.strptime(data.symptom_date, "%Y-%m-%d")
    
    # حذف السجل القديم لنفس اليوم إن وجد
    result = await db.execute(
        select(DailySymptom).where(
            DailySymptom.user_id == current_user.id,
            DailySymptom.symptom_date >= symptom_date.replace(hour=0),
            DailySymptom.symptom_date < symptom_date.replace(hour=23, minute=59),
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        await db.delete(existing)
    
    symptom = DailySymptom(
        user_id=current_user.id,
        symptom_date=symptom_date,
        **data.model_dump(exclude={"symptom_date"}),
    )
    db.add(symptom)
    await db.commit()
    
    return {"message": "تم تسجيل الأعراض", "id": str(symptom.id)}


@router_symptoms.get("/")
async def get_symptoms(
    days: int = Query(7, le=90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.utcnow() - __import__('datetime').timedelta(days=days)
    result = await db.execute(
        select(DailySymptom)
        .where(DailySymptom.user_id == current_user.id, DailySymptom.symptom_date >= since)
        .order_by(desc(DailySymptom.symptom_date))
    )
    symptoms = result.scalars().all()
    return [_symptom_to_dict(s) for s in symptoms]


# ─── Alerts ──────────────────────────────────────────────────────────────────

@router_alerts.get("/")
async def get_alerts(
    unread_only: bool = False,
    limit: int = Query(20, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Alert).where(Alert.user_id == current_user.id)
    if unread_only:
        query = query.where(Alert.is_read == False)
    query = query.order_by(desc(Alert.created_at)).limit(limit)
    
    result = await db.execute(query)
    alerts = result.scalars().all()
    return [_alert_to_dict(a) for a in alerts]


@router_alerts.put("/{alert_id}/read")
async def mark_alert_read(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == current_user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="التنبيه غير موجود")
    
    alert.is_read = True
    await db.commit()
    return {"message": "تم تعليم التنبيه كمقروء"}


@router_alerts.put("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Alert).where(Alert.user_id == current_user.id, Alert.is_read == False)
    )
    for alert in result.scalars().all():
        alert.is_read = True
    await db.commit()
    return {"message": "تم تعليم جميع التنبيهات كمقروءة"}


# ─── Analysis ────────────────────────────────────────────────────────────────

@router_analysis.get("/latest")
async def get_latest_analysis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """آخر تحليل ذكي"""
    result = await db.execute(
        select(Measurement)
        .where(
            Measurement.user_id == current_user.id,
            Measurement.ai_analysis != None,
        )
        .order_by(desc(Measurement.measured_at))
        .limit(1)
    )
    measurement = result.scalar_one_or_none()
    
    if not measurement:
        return {"analysis": None, "message": "لا يوجد تحليل بعد. قم بقياس وزنك أولاً"}
    
    return {
        "analysis": measurement.ai_analysis,
        "analyzed_at": measurement.ai_analyzed_at.isoformat() if measurement.ai_analyzed_at else None,
        "measurement": _measurement_to_dict(measurement),
    }


@router_analysis.get("/pregnancy-chart")
async def get_pregnancy_chart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """بيانات رسم بياني للحمل"""
    result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile or not profile.is_pregnant:
        raise HTTPException(status_code=400, detail="المستخدم ليس في وضع الحمل")
    
    # كل القياسات منذ الحمل
    result = await db.execute(
        select(Measurement)
        .where(
            Measurement.user_id == current_user.id,
            Measurement.measured_at >= profile.pregnancy_start_date,
        )
        .order_by(Measurement.measured_at)
    )
    measurements = result.scalars().all()
    
    from app.analysis.pregnancy_analyzer import pregnancy_analyzer
    
    chart_data = []
    for m in measurements:
        if not m.weight_kg or not profile.pre_pregnancy_weight:
            continue
        
        gain = m.weight_kg - profile.pre_pregnancy_weight
        # حساب الأسبوع وقت القياس
        if profile.pregnancy_start_date:
            days_pregnant = (m.measured_at - profile.pregnancy_start_date).days
            week_at_measurement = max(1, days_pregnant // 7)
        else:
            week_at_measurement = profile.pregnancy_week or 0
        
        pre_bmi = profile.pre_pregnancy_weight / ((current_user.height_cm / 100) ** 2) if current_user.height_cm else 22
        expected = pregnancy_analyzer.get_expected_total_gain(week_at_measurement, pre_bmi)
        
        chart_data.append({
            "date": m.measured_at.isoformat(),
            "week": week_at_measurement,
            "actual_gain": round(gain, 2),
            "expected_min": expected[0],
            "expected_max": expected[1],
            "weight": m.weight_kg,
            "water_ratio": m.water_ratio,
        })
    
    return {
        "chart_data": chart_data,
        "current_week": profile.pregnancy_week,
        "expected_due_date": profile.expected_due_date.isoformat() if profile.expected_due_date else None,
    }


# ─── Serializers ─────────────────────────────────────────────────────────────

def _measurement_to_dict(m: Measurement) -> dict:
    if not m:
        return None
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
        "ai_analysis": m.ai_analysis,
        "source": m.source,
    }


def _profile_to_dict(p: HealthProfile) -> dict:
    if not p:
        return {}
    return {
        "is_pregnant": p.is_pregnant,
        "pregnancy_week": p.pregnancy_week,
        "pregnancy_start_date": p.pregnancy_start_date.isoformat() if p.pregnancy_start_date else None,
        "pre_pregnancy_weight": p.pre_pregnancy_weight,
        "expected_due_date": p.expected_due_date.isoformat() if p.expected_due_date else None,
        "has_kidney_disease": p.has_kidney_disease,
        "on_dialysis": p.on_dialysis,
        "dry_weight_kg": p.dry_weight_kg,
        "dialysis_days": p.dialysis_days,
        "has_diabetes": p.has_diabetes,
        "diabetes_type": p.diabetes_type,
        "has_hypertension": p.has_hypertension,
        "has_heart_disease": p.has_heart_disease,
        "target_weight": p.target_weight,
        "activity_level": p.activity_level,
    }


def _alert_to_dict(a: Alert) -> dict:
    if not a:
        return None
    return {
        "id": str(a.id),
        "alert_type": a.alert_type,
        "severity": a.severity,
        "title": a.title,
        "message": a.message,
        "recommendations": a.recommendations,
        "is_read": a.is_read,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


def _symptom_to_dict(s: DailySymptom) -> dict:
    if not s:
        return None
    return {
        "id": str(s.id),
        "symptom_date": s.symptom_date.isoformat() if s.symptom_date else None,
        "headache_level": s.headache_level,
        "swelling_level": s.swelling_level,
        "swelling_location": s.swelling_location,
        "nausea_level": s.nausea_level,
        "blurred_vision": s.blurred_vision,
        "upper_abdominal_pain": s.upper_abdominal_pain,
        "fatigue_level": s.fatigue_level,
        "shortness_of_breath": s.shortness_of_breath,
        "dizziness": s.dizziness,
        "chest_pain": s.chest_pain,
        "decreased_urination": s.decreased_urination,
        "mood": s.mood,
        "sleep_hours": s.sleep_hours,
        "water_intake_liters": s.water_intake_liters,
        "notes": s.notes,
    }