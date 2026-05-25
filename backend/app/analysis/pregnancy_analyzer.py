"""
محرك تحليل الحمل
يكشف مخاطر تسمم الحمل وضعف نمو الجنين
"""
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class AlertResult:
    alert_type: str
    severity: str  # info | warning | critical | emergency
    title: str
    message: str
    recommendations: list[str] = field(default_factory=list)
    score: float = 0.0


# الزيادة الإجمالية الموصى بها حسب BMI قبل الحمل
TOTAL_WEIGHT_GAIN_BY_BMI = {
    "underweight": (12.5, 18.0),    # BMI < 18.5
    "normal":      (11.5, 16.0),    # BMI 18.5-24.9
    "overweight":  (7.0, 11.5),     # BMI 25-29.9
    "obese":       (5.0, 9.0),      # BMI >= 30
}

# الزيادة الأسبوعية الطبيعية (كغ/أسبوع)
WEEKLY_GAIN_RATES = {
    "first_trimester":  (0, 2.0),   # الثلث الأول - إجمالي لا أسبوعي
    "second_trimester": (0.3, 0.5),
    "third_trimester":  (0.3, 0.5),
}


class PregnancyAnalyzer:
    
    def get_bmi_category(self, bmi: float) -> str:
        if bmi < 18.5:
            return "underweight"
        elif bmi < 25:
            return "normal"
        elif bmi < 30:
            return "overweight"
        return "obese"
    
    def get_trimester(self, week: int) -> str:
        if week <= 13:
            return "first_trimester"
        elif week <= 26:
            return "second_trimester"
        return "third_trimester"
    
    def get_expected_total_gain(self, pregnancy_week: int, pre_pregnancy_bmi: float) -> tuple[float, float]:
        """الزيادة المتوقعة الإجمالية حتى هذا الأسبوع"""
        bmi_cat = self.get_bmi_category(pre_pregnancy_bmi)
        total_min, total_max = TOTAL_WEIGHT_GAIN_BY_BMI[bmi_cat]
        
        # توزيع الزيادة: 20% في الثلث الأول، 40% ثانية، 40% ثالثة
        if pregnancy_week <= 13:
            fraction = (pregnancy_week / 40) * 0.5
        elif pregnancy_week <= 26:
            fraction = 0.065 + ((pregnancy_week - 13) / 40) * 0.4
        else:
            fraction = 0.195 + ((pregnancy_week - 26) / 40) * 0.6
        
        fraction = min(fraction, 1.0)
        return (round(total_min * fraction, 1), round(total_max * fraction, 1))
    
    def analyze(
        self,
        current_measurement: dict,
        previous_measurements: list[dict],
        health_profile: dict,
        today_symptoms: Optional[dict] = None,
    ) -> list[AlertResult]:
        """التحليل الكامل لقياس الحمل"""
        
        alerts = []
        weight = current_measurement.get("weight_kg")
        water_ratio = current_measurement.get("water_ratio")
        pregnancy_week = health_profile.get("pregnancy_week", 0)
        pre_pregnancy_weight = health_profile.get("pre_pregnancy_weight")
        
        if not weight or not pregnancy_week:
            return alerts
        
        # ١. حساب الزيادة الإجمالية منذ الحمل
        if pre_pregnancy_weight:
            total_gain = weight - pre_pregnancy_weight
            alerts.extend(self._check_total_weight_gain(
                total_gain, pregnancy_week, health_profile
            ))
        
        # ٢. فحص الزيادة في 24 ساعة (الأخطر)
        if previous_measurements:
            last_24h = self._get_measurement_before_hours(previous_measurements, 24)
            last_48h = self._get_measurement_before_hours(previous_measurements, 48)
            
            if last_24h:
                gain_24h = weight - last_24h["weight_kg"]
                water_change = None
                if water_ratio and last_24h.get("water_ratio"):
                    water_change = water_ratio - last_24h["water_ratio"]
                
                alerts.extend(self._check_rapid_gain(gain_24h, water_change, pregnancy_week))
            
            # ٣. فحص اتجاه الأسبوع
            weekly_gain = self._calculate_weekly_trend(previous_measurements, weight)
            if weekly_gain is not None:
                alerts.extend(self._check_weekly_rate(weekly_gain, pregnancy_week))
        
        # ٤. كشف تسمم الحمل (الأهم)
        if today_symptoms:
            preeclampsia_alerts = self._check_preeclampsia_risk(
                current_measurement, today_symptoms, pregnancy_week, previous_measurements
            )
            alerts.extend(preeclampsia_alerts)
        
        return alerts
    
    def _check_rapid_gain(
        self, gain_24h: float, water_change: Optional[float], week: int
    ) -> list[AlertResult]:
        alerts = []
        
        if gain_24h <= 0.5:
            return alerts
        
        is_fluid = water_change and water_change > 1.5
        
        if gain_24h > 2.0:
            alerts.append(AlertResult(
                alert_type="rapid_weight_gain_24h",
                severity="critical",
                title=" زيادة وزن مفاجئة جداً",
                message=f"وزنك زاد {gain_24h:.1f} كغ خلال 24 ساعة. "
                        f"{'هذه زيادة من السوائل وليست دهوناً، وهذا مؤشر خطير.' if is_fluid else 'هذه الزيادة كبيرة جداً وتستحق الانتباه.'}",
                recommendations=[
                    "اتصلي بطبيبك فوراً",
                    "قيسي ضغط الدم إن أمكن",
                    "لاحظي أي تورم في الوجه أو اليدين",
                    "لا تتجاهلي هذا التحذير",
                ],
                score=5.0,
            ))
        elif gain_24h > 1.0:
            alerts.append(AlertResult(
                alert_type="fluid_retention_warning",
                severity="warning",
                title="⚠️ زيادة غير طبيعية في الوزن",
                message=f"وزنك زاد {gain_24h:.1f} كغ في 24 ساعة. "
                        f"{'نسبة الماء في جسمك ارتفعت، مما يشير لاحتباس سوائل.' if is_fluid else 'راقبي وزنك جيداً.'}",
                recommendations=[
                    "أخبري طبيبك في الزيارة القادمة",
                    "قللي من الأملاح والصوديوم",
                    "ارفعي قدميك عند الجلوس",
                ],
                score=3.0,
            ))
        
        return alerts
    
    def _check_preeclampsia_risk(
        self,
        measurement: dict,
        symptoms: dict,
        week: int,
        history: list[dict],
    ) -> list[AlertResult]:
        """
        نظام نقاط لكشف خطر تسمم الحمل
        Pre-eclampsia يقتل 70,000 أم سنوياً - أهم ميزة في التطبيق
        """
        if week < 20:  # تسمم الحمل نادر قبل الأسبوع 20
            return []
        
        score = 0.0
        risk_factors = []
        
        # الأعراض الخطيرة جداً (علامات تسمم الحمل الكلاسيكية)
        if symptoms.get("blurred_vision"):
            score += 4.0
            risk_factors.append("تشوش الرؤية (علامة خطيرة)")
        
        if symptoms.get("upper_abdominal_pain"):
            score += 4.0
            risk_factors.append("ألم أعلى البطن")
        
        if symptoms.get("light_sensitivity"):
            score += 2.0
            risk_factors.append("حساسية للضوء")
        
        # الصداع الشديد
        headache = symptoms.get("headache_level", 0) or 0
        if headache >= 8:
            score += 3.5
            risk_factors.append(f"صداع شديد جداً (درجة {headache}/10)")
        elif headache >= 6:
            score += 2.0
            risk_factors.append(f"صداع متوسط (درجة {headache}/10)")
        
        # التورم المفاجئ
        swelling = symptoms.get("swelling_level", 0) or 0
        swelling_location = symptoms.get("swelling_location", []) or []
        face_swelling = "face" in swelling_location or "hands" in swelling_location
        
        if swelling >= 7 or face_swelling:
            score += 3.0
            risk_factors.append("تورم في الوجه/اليدين (علامة مهمة)")
        elif swelling >= 5:
            score += 1.5
            risk_factors.append("تورم ملحوظ")
        
        # زيادة الوزن المفاجئة من السوائل
        if history:
            last_48h = self._get_measurement_before_hours(history, 48)
            if last_48h:
                gain = measurement.get("weight_kg", 0) - last_48h.get("weight_kg", 0)
                water_up = (measurement.get("water_ratio", 0) or 0) > (last_48h.get("water_ratio", 0) or 0) + 2
                if gain > 1.5 and water_up:
                    score += 3.0
                    risk_factors.append(f"زيادة سوائل مفاجئة +{gain:.1f} كغ/48 ساعة")
        
        # بناء التنبيه
        alerts = []
        
        if score >= 8.0:
            alerts.append(AlertResult(
                alert_type="preeclampsia_risk",
                severity="emergency",
                title=" خطر تسمم الحمل - اتصلي بالطوارئ",
                message=f"الأعراض والقياسات تشير بقوة لاحتمال تسمم الحمل.\n"
                        f"المؤشرات: {', '.join(risk_factors)}",
                recommendations=[
                    " اتصلي بالطوارئ أو اذهبي للطوارئ فوراً",
                    "تسمم الحمل حالة طارئة تهدد حياتك وحياة جنينك",
                    "لا تقودي بنفسك - اطلبي مساعدة",
                    "أخبري الأطباء بجميع الأعراض",
                ],
                score=score,
            ))
        elif score >= 5.0:
            alerts.append(AlertResult(
                alert_type="preeclampsia_risk",
                severity="critical",
                title=" مؤشرات تسمم حمل - تحتاج تقييم طبي عاجل",
                message=f"لديك عدة مؤشرات قد تدل على تسمم الحمل.\n"
                        f"الأعراض: {', '.join(risk_factors)}",
                recommendations=[
                    "اتصلي بطبيبك أو اذهبي للمستشفى اليوم",
                    "قيسي ضغط الدم إن أمكن",
                    "لا تنتظري الزيارة المجدولة إذا ساءت الأعراض",
                    "اصطحبي شخصاً معك",
                ],
                score=score,
            ))
        elif score >= 3.0:
            alerts.append(AlertResult(
                alert_type="preeclampsia_watch",
                severity="warning",
                title="⚠️ راقبي هذه الأعراض بعناية",
                message=f"بعض الأعراض تستحق المتابعة الدقيقة.\nالمؤشرات: {', '.join(risk_factors)}",
                recommendations=[
                    "أخبري طبيبك بهذه الأعراض",
                    "سجّلي الأعراض يومياً",
                    "قيسي ضغط دمك يومياً إن أمكن",
                ],
                score=score,
            ))
        
        return alerts
    
    def _check_total_weight_gain(
        self, total_gain: float, week: int, profile: dict
    ) -> list[AlertResult]:
        pre_bmi = profile.get("pre_pregnancy_bmi")
        if not pre_bmi:
            return []
        
        expected_min, expected_max = self.get_expected_total_gain(week, pre_bmi)
        alerts = []
        
        if total_gain < expected_min * 0.7:
            alerts.append(AlertResult(
                alert_type="low_weight_gain",
                severity="warning",
                title="وزنك أقل من المتوقع لهذه المرحلة",
                message=f"في الأسبوع {week}، الزيادة الطبيعية: {expected_min}-{expected_max} كغ\n"
                        f"زيادتك الحالية: {total_gain:.1f} كغ",
                recommendations=[
                    "تأكدي من كفاية التغذية",
                    "أخبري طبيبك في الزيارة القادمة",
                    "قد يطلب الطبيب فحص الجنين",
                ],
            ))
        elif total_gain > expected_max * 1.3:
            alerts.append(AlertResult(
                alert_type="high_weight_gain",
                severity="warning",
                title="الوزن أعلى من المتوقع",
                message=f"في الأسبوع {week}، الزيادة الطبيعية: {expected_min}-{expected_max} كغ\n"
                        f"زيادتك: {total_gain:.1f} كغ",
                recommendations=[
                    "راجعي نظامك الغذائي",
                    "استشيري طبيبك وأخصائية التغذية",
                    "فحص سكر الحمل إن لم يتم",
                ],
            ))
        
        return alerts
    
    def _check_weekly_rate(self, weekly_gain: float, week: int) -> list[AlertResult]:
        if week <= 13:  # الثلث الأول لا يُحسب أسبوعياً
            return []
        
        min_rate, max_rate = 0.3, 0.5
        alerts = []
        
        if weekly_gain > max_rate * 2:
            alerts.append(AlertResult(
                alert_type="weekly_gain_high",
                severity="warning",
                title="زيادة أسبوعية مرتفعة",
                message=f"زيادة هذا الأسبوع: {weekly_gain:.2f} كغ (الطبيعي: {min_rate}-{max_rate} كغ/أسبوع)",
                recommendations=["تابعي مع طبيبك"],
            ))
        
        return alerts
    
    def _get_measurement_before_hours(self, measurements: list[dict], hours: int) -> Optional[dict]:
        """إيجاد القياس الأقرب لوقت معين"""
        target = datetime.utcnow() - timedelta(hours=hours)
        closest = None
        min_diff = float("inf")
        
        for m in measurements:
            measured_at = m.get("measured_at")
            if isinstance(measured_at, str):
                measured_at = datetime.fromisoformat(measured_at)
            
            if measured_at and measured_at <= datetime.utcnow():
                diff = abs((measured_at - target).total_seconds())
                if diff < min_diff and diff < 12 * 3600:  # في نطاق 12 ساعة
                    min_diff = diff
                    closest = m
        
        return closest
    
    def _calculate_weekly_trend(
        self, measurements: list[dict], current_weight: float
    ) -> Optional[float]:
        """حساب معدل الزيادة الأسبوعي"""
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        for m in sorted(measurements, key=lambda x: x.get("measured_at", datetime.min)):
            measured_at = m.get("measured_at")
            if isinstance(measured_at, str):
                measured_at = datetime.fromisoformat(measured_at)
            
            if measured_at and abs((measured_at - week_ago).total_seconds()) < 2 * 24 * 3600:
                return current_weight - m.get("weight_kg", current_weight)
        
        return None


pregnancy_analyzer = PregnancyAnalyzer()
