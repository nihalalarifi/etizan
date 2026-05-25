"""
محرك تحليل أمراض الكلى
يكشف احتجاز السوائل الخطير بين جلسات الغسيل
"""
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional

from app.analysis.pregnancy_analyzer import AlertResult


class KidneyAnalyzer:
    
    # الحدود الحرجة
    WARNING_FLUID_KG = 2.0      # تجاوز الوزن الجاف بـ 2 كغ = تحذير
    CRITICAL_FLUID_KG = 3.5     # تجاوز 3.5 كغ = خطر
    EMERGENCY_FLUID_KG = 5.0    # تجاوز 5 كغ = طوارئ
    RAPID_GAIN_24H = 1.5        # زيادة 1.5 كغ في 24 ساعة = تنبيه فوري
    
    def analyze(
        self,
        current_measurement: dict,
        previous_measurements: list[dict],
        health_profile: dict,
        today_symptoms: Optional[dict] = None,
    ) -> list[AlertResult]:
        
        alerts = []
        weight = current_measurement.get("weight_kg")
        water_ratio = current_measurement.get("water_ratio")
        dry_weight = health_profile.get("dry_weight_kg")
        on_dialysis = health_profile.get("on_dialysis", False)
        last_dialysis = health_profile.get("last_dialysis_date")
        
        if not weight:
            return alerts
        
        # ١. احتجاز السوائل فوق الوزن الجاف
        if dry_weight and on_dialysis:
            fluid_excess = weight - dry_weight
            alerts.extend(self._check_fluid_overload(
                fluid_excess, last_dialysis, health_profile
            ))
        
        # ٢. الزيادة المفاجئة في 24 ساعة
        if previous_measurements:
            last_24h = self._get_last_measurement(previous_measurements, hours=24)
            if last_24h and last_24h.get("weight_kg"):
                gain_24h = weight - last_24h["weight_kg"]
                water_change = None
                if water_ratio and last_24h.get("water_ratio"):
                    water_change = water_ratio - last_24h["water_ratio"]
                
                alerts.extend(self._check_rapid_fluid_gain(gain_24h, water_change))
        
        # ٣. الأعراض مع التحليل
        if today_symptoms:
            alerts.extend(self._check_symptoms(today_symptoms, weight, dry_weight))
        
        # ٤. تحليل تكوين الجسم - هل الزيادة من سوائل؟
        if water_ratio:
            alerts.extend(self._analyze_body_composition(
                current_measurement, previous_measurements
            ))
        
        return alerts
    
    def _check_fluid_overload(
        self, fluid_excess: float, last_dialysis: Optional[datetime], profile: dict
    ) -> list[AlertResult]:
        alerts = []
        
        # حساب الوقت منذ آخر جلسة
        days_since_dialysis = 1
        if last_dialysis:
            if isinstance(last_dialysis, str):
                last_dialysis = datetime.fromisoformat(last_dialysis)
            days_since_dialysis = max(1, (datetime.utcnow() - last_dialysis).days)
        
        # الزيادة المتوقعة (حوالي 0.5-1 كغ/يوم)
        expected_excess = days_since_dialysis * 0.75
        excess_above_expected = fluid_excess - expected_excess
        
        next_dialysis = profile.get("next_dialysis_date", "جلستك القادمة")
        
        if fluid_excess >= self.EMERGENCY_FLUID_KG:
            alerts.append(AlertResult(
                alert_type="kidney_fluid_emergency",
                severity="emergency",
                title=" احتجاز سوائل خطير جداً",
                message=f"وزنك يتجاوز وزنك الجاف بـ {fluid_excess:.1f} كغ.\n"
                        f"هذه الكمية من السوائل قد تضغط على القلب والرئتين.",
                recommendations=[
                    " اتصل بمركز الغسيل أو اذهب للطوارئ فوراً",
                    "لا تنتظر الجلسة المجدولة",
                    "لاحظ أي صعوبة في التنفس أو ألم صدر",
                    "لا تشرب الكثير من السوائل",
                ],
                score=10.0,
            ))
        elif fluid_excess >= self.CRITICAL_FLUID_KG:
            alerts.append(AlertResult(
                alert_type="kidney_fluid_critical",
                severity="critical",
                title=" احتجاز سوائل مرتفع",
                message=f"وزنك فوق وزنك الجاف بـ {fluid_excess:.1f} كغ.\n"
                        f"الجلسة القادمة: {next_dialysis}",
                recommendations=[
                    "اتصل بطبيبك أو مركز الغسيل اليوم",
                    "قلّل السوائل والملح",
                    "راقب ضغط التنفس",
                    "قد تحتاج جلسة غسيل إضافية",
                ],
                score=7.0,
            ))
        elif fluid_excess >= self.WARNING_FLUID_KG:
            alerts.append(AlertResult(
                alert_type="kidney_fluid_warning",
                severity="warning",
                title="⚠️ السوائل فوق الحد المسموح",
                message=f"وزنك فوق وزنك الجاف بـ {fluid_excess:.1f} كغ.\n"
                        f"الجلسة القادمة: {next_dialysis}",
                recommendations=[
                    "قلّل من شرب السوائل",
                    "تجنب الأطعمة المالحة",
                    "أخبر طبيبك",
                ],
                score=4.0,
            ))
        else:
            alerts.append(AlertResult(
                alert_type="kidney_fluid_normal",
                severity="info",
                title=" السوائل ضمن الحدود الطبيعية",
                message=f"السوائل المتراكمة: {fluid_excess:.1f} كغ فوق وزنك الجاف. "
                        f"هذا طبيعي لـ {days_since_dialysis} يوم من الجلسة.",
                recommendations=["استمر في التزام حصة السوائل اليومية"],
                score=0,
            ))
        
        return alerts
    
    def _check_rapid_fluid_gain(
        self, gain_24h: float, water_change: Optional[float]
    ) -> list[AlertResult]:
        alerts = []
        
        if gain_24h <= 0:
            return alerts
        
        is_fluid = water_change is not None and water_change > 1.5
        
        if gain_24h >= self.RAPID_GAIN_24H:
            severity = "critical" if gain_24h >= 2.0 else "warning"
            alerts.append(AlertResult(
                alert_type="rapid_fluid_gain_24h",
                severity=severity,
                title=f"{'' if severity == 'critical' else '⚠️'} زيادة مفاجئة: +{gain_24h:.1f} كغ في 24 ساعة",
                message=f"وزنك زاد {gain_24h:.1f} كغ في 24 ساعة.\n"
                        f"{'هذه زيادة من السوائل وليست دهوناً.' if is_fluid else ''}",
                recommendations=[
                    "اتصل بمركز الغسيل فوراً" if gain_24h >= 2.0 else "أبلغ طبيبك",
                    "لا تزيد من شرب السوائل",
                    "قس ضغط دمك",
                ],
                score=gain_24h * 2.5,
            ))
        
        return alerts
    
    def _check_symptoms(
        self, symptoms: dict, weight: float, dry_weight: Optional[float]
    ) -> list[AlertResult]:
        alerts = []
        score = 0
        concerns = []
        
        if symptoms.get("shortness_of_breath"):
            score += 4
            concerns.append("صعوبة في التنفس")
        
        if symptoms.get("chest_pain"):
            score += 5
            concerns.append("ألم في الصدر")
        
        if symptoms.get("decreased_urination"):
            score += 3
            concerns.append("انخفاض كمية البول")
        
        if symptoms.get("swelling_level", 0) >= 7:
            score += 2
            concerns.append("تورم شديد")
        
        if score >= 7:
            alerts.append(AlertResult(
                alert_type="kidney_symptom_emergency",
                severity="emergency",
                title=" أعراض خطيرة - اطلب مساعدة طبية فوراً",
                message=f"الأعراض: {', '.join(concerns)}\n"
                        "هذه الأعراض مع مرض الكلى تحتاج تقييم طبي عاجل.",
                recommendations=["اذهب للطوارئ الآن أو اتصل بـ 911/إسعاف"],
                score=10.0,
            ))
        elif score >= 4:
            alerts.append(AlertResult(
                alert_type="kidney_symptom_warning",
                severity="critical",
                title=" أعراض تحتاج متابعة عاجلة",
                message=f"الأعراض: {', '.join(concerns)}",
                recommendations=["اتصل بمركز الغسيل أو طبيبك اليوم"],
                score=float(score),
            ))
        
        return alerts
    
    def _analyze_body_composition(
        self, current: dict, history: list[dict]
    ) -> list[AlertResult]:
        """تحليل تكوين الجسم لتمييز زيادة السوائل عن الدهون"""
        if not history:
            return []
        
        water_ratio = current.get("water_ratio")
        fat_ratio = current.get("fat_ratio")
        
        if not water_ratio:
            return []
        
        # نسبة الماء الطبيعية للرجال 60-65%، للنساء 50-60%
        # مرضى الكلى قد تكون أعلى
        if water_ratio > 70:
            return [AlertResult(
                alert_type="high_water_ratio",
                severity="warning",
                title=f"⚠️ نسبة الماء في جسمك مرتفعة: {water_ratio:.1f}%",
                message="نسبة الماء تتجاوز الحد الطبيعي مما يشير لاحتجاز سوائل.",
                recommendations=["أبلغ طبيبك بهذا القياس"],
            )]
        
        return []
    
    def _get_last_measurement(
        self, measurements: list[dict], hours: int
    ) -> Optional[dict]:
        target = datetime.utcnow() - timedelta(hours=hours)
        
        for m in sorted(
            measurements,
            key=lambda x: abs((self._parse_dt(x.get("measured_at")) - target).total_seconds())
        ):
            dt = self._parse_dt(m.get("measured_at"))
            if dt and abs((dt - target).total_seconds()) < 6 * 3600:
                return m
        return None
    
    def _parse_dt(self, val) -> Optional[datetime]:
        if isinstance(val, datetime):
            return val
        if isinstance(val, str):
            try:
                return datetime.fromisoformat(val)
            except Exception:
                return None
        return None


kidney_analyzer = KidneyAnalyzer()
