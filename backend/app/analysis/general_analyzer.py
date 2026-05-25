"""
محرك التحليل الصحي العام 
"""
from datetime import datetime, timedelta
from typing import Optional
import google.generativeai as genai
import logging

from app.core.config import settings
from app.analysis.pregnancy_analyzer import AlertResult

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-1.5-flash")


class GeneralHealthAnalyzer:
    
    # BMI categories
    BMI_CATEGORIES = {
        (0, 18.5): ("نقص في الوزن", "info"),
        (18.5, 25): ("وزن طبيعي مثالي", "info"),
        (25, 30): ("زيادة في الوزن", "warning"),
        (30, 35): ("سمنة درجة أولى", "warning"),
        (35, 40): ("سمنة درجة ثانية", "critical"),
        (40, 200): ("سمنة مرضية درجة ثالثة", "critical"),
    }
    
    def analyze(
        self,
        current_measurement: dict,
        previous_measurements: list[dict],
        health_profile: dict,
        today_symptoms: Optional[dict] = None,
    ) -> list[AlertResult]:
        alerts = []
        
        weight = current_measurement.get("weight_kg")
        bmi = current_measurement.get("bmi")
        fat_ratio = current_measurement.get("fat_ratio")
        heart_rate = current_measurement.get("heart_rate")
        water_ratio = current_measurement.get("water_ratio")
        muscle_mass = current_measurement.get("muscle_mass_kg")
        
        # ١. BMI analysis
        if bmi:
            alerts.extend(self._analyze_bmi(bmi, health_profile))
        
        # ٢. Heart rate
        if heart_rate:
            alerts.extend(self._analyze_heart_rate(heart_rate))
        
        # ٣. Trend analysis (30 days)
        if previous_measurements and weight:
            alerts.extend(self._analyze_trend(weight, previous_measurements, health_profile))
        
        # ٤. Body composition
        if fat_ratio and muscle_mass:
            alerts.extend(self._analyze_composition(fat_ratio, muscle_mass, health_profile))
        
        return alerts
    
    def _analyze_bmi(self, bmi: float, profile: dict) -> list[AlertResult]:
        gender = profile.get("gender", "male")
        
        for (min_bmi, max_bmi), (label, severity) in self.BMI_CATEGORIES.items():
            if min_bmi <= bmi < max_bmi:
                if severity == "info":
                    return []  # لا تنبيه للوزن الطبيعي
                
                return [AlertResult(
                    alert_type="bmi_alert",
                    severity=severity,
                    title=f"مؤشر كتلة الجسم: {bmi:.1f} - {label}",
                    message=self._get_bmi_message(bmi, label, gender),
                    recommendations=self._get_bmi_recommendations(bmi),
                )]
        return []
    
    def _get_bmi_message(self, bmi: float, label: str, gender: str) -> str:
        if bmi < 18.5:
            return f"مؤشرك {bmi:.1f}. نقص الوزن يؤثر على المناعة والطاقة والهرمونات."
        elif bmi < 25:
            return f"ممتاز! مؤشرك {bmi:.1f} ضمن النطاق المثالي."
        elif bmi < 30:
            return f"مؤشرك {bmi:.1f}. الوصول للنطاق الطبيعي يقلل مخاطر السكري وأمراض القلب."
        else:
            return f"مؤشرك {bmi:.1f}. السمنة تزيد خطر أمراض القلب والسكري والضغط."
    
    def _get_bmi_recommendations(self, bmi: float) -> list[str]:
        if bmi < 18.5:
            return [
                "استشر طبيباً أو أخصائي تغذية",
                "زد السعرات الحرارية بشكل صحي",
                "أضف تمارين القوة",
            ]
        elif bmi >= 30:
            return [
                "استشر طبيباً لخطة علاج شاملة",
                "ابدأ بتغييرات غذائية تدريجية",
                "مشي 30 دقيقة يومياً",
                "قلل السكريات والدهون المشبعة",
            ]
        return [
            "حافظ على نظامك الغذائي الحالي",
            "مارس الرياضة 150 دقيقة أسبوعياً",
        ]
    
    def _analyze_heart_rate(self, heart_rate: int) -> list[AlertResult]:
        if 60 <= heart_rate <= 100:
            return []
        
        if heart_rate < 50:
            return [AlertResult(
                alert_type="low_heart_rate",
                severity="warning",
                title=f"معدل ضربات قلب منخفض: {heart_rate} نبضة/دقيقة",
                message="معدل الضربات أقل من 50 - يحتاج تقييم طبي إذا لم تكن رياضياً.",
                recommendations=["استشر طبيبك"],
            )]
        elif heart_rate > 100:
            severity = "critical" if heart_rate > 120 else "warning"
            return [AlertResult(
                alert_type="high_heart_rate",
                severity=severity,
                title=f"معدل ضربات قلب مرتفع: {heart_rate} نبضة/دقيقة",
                message=f"{'مرتفع جداً، يحتاج تقييم طبي عاجل.' if heart_rate > 120 else 'أعلى من الطبيعي. تأكد من الراحة والرطوبة الكافية.'}",
                recommendations=[
                    "استرح قبل القياس" if heart_rate <= 120 else "استشر طبيبك",
                    "تأكد من الترطيب الجيد",
                ],
            )]
        
        return []
    
    def _analyze_trend(
        self, current_weight: float, history: list[dict], profile: dict
    ) -> list[AlertResult]:
        alerts = []
        
        # اتجاه 30 يوم
        month_ago_measurement = self._get_measurement_days_ago(history, 30)
        if month_ago_measurement:
            monthly_change = current_weight - month_ago_measurement.get("weight_kg", current_weight)
            target = profile.get("target_weight")
            
            if target:
                direction = "فقدان" if target < current_weight else "زيادة"
                if direction == "فقدان" and monthly_change > 1:
                    alerts.append(AlertResult(
                        alert_type="weight_moving_wrong_direction",
                        severity="info",
                        title=f"وزنك زاد {monthly_change:.1f} كغ هذا الشهر",
                        message=f"هدفك {target:.1f} كغ. مراجعة النظام الغذائي قد تساعد.",
                        recommendations=["راجع نظامك الغذائي والنشاط البدني"],
                    ))
        
        return alerts
    
    def _analyze_composition(
        self, fat_ratio: float, muscle_mass_kg: float, profile: dict
    ) -> list[AlertResult]:
        gender = profile.get("gender", "male")
        alerts = []
        
        # حدود الدهون الصحية
        healthy_fat_range = (10, 20) if gender == "male" else (20, 32)
        
        if fat_ratio > healthy_fat_range[1] + 10:
            alerts.append(AlertResult(
                alert_type="high_body_fat",
                severity="warning",
                title=f"نسبة الدهون مرتفعة: {fat_ratio:.1f}%",
                message=f"النطاق الصحي: {healthy_fat_range[0]}-{healthy_fat_range[1]}%",
                recommendations=[
                    "مزاوجة بين تمارين الكارديو والقوة",
                    "مراجعة السعرات الحرارية",
                ],
            ))
        
        return alerts
    
    def _get_measurement_days_ago(
        self, measurements: list[dict], days: int
    ) -> Optional[dict]:
        target = datetime.utcnow() - timedelta(days=days)
        closest = None
        min_diff = float("inf")
        
        for m in measurements:
            dt = m.get("measured_at")
            if isinstance(dt, str):
                try:
                    dt = datetime.fromisoformat(dt)
                except Exception:
                    continue
            
            if dt:
                diff = abs((dt - target).total_seconds())
                if diff < min_diff and diff < 4 * 24 * 3600:
                    min_diff = diff
                    closest = m
        
        return closest


general_analyzer = GeneralHealthAnalyzer()


async def run_ai_analysis(
    user_data: dict,
    current_measurement: dict,
    history: list[dict],
    symptoms: Optional[dict],
    alerts: list[dict],
    language: str = "ar",
) -> str:
    """تحليل شامل بالذكاء الاصطناعي باستخدام Claude"""
    
    profile = user_data.get("health_profile", {})
    
    # بناء السياق
    context_parts = [
        f"الاسم: {user_data.get('name', 'المستخدم')}",
        f"الجنس: {'أنثى' if user_data.get('gender') == 'female' else 'ذكر'}",
        f"العمر: {user_data.get('age', 'غير محدد')} سنة",
        f"الطول: {user_data.get('height_cm', 'غير محدد')} سم",
    ]
    
    if profile.get("is_pregnant"):
        context_parts.append(f"حامل - الأسبوع: {profile.get('pregnancy_week')}")
    if profile.get("has_kidney_disease"):
        context_parts.append("مريض كلى")
    if profile.get("on_dialysis"):
        context_parts.append(f"يخضع للغسيل - الوزن الجاف: {profile.get('dry_weight_kg')} كغ")
    if profile.get("has_diabetes"):
        context_parts.append(f"مريض سكري - النوع: {profile.get('diabetes_type')}")
    if profile.get("has_hypertension"):
        context_parts.append("ارتفاع ضغط الدم")
    
    # القياسات الحالية
    measurement_text = "\n".join([
        f"- الوزن: {current_measurement.get('weight_kg', 'N/A')} كغ",
        f"- مؤشر كتلة الجسم: {current_measurement.get('bmi', 'N/A')}",
        f"- الدهون: {current_measurement.get('fat_ratio', 'N/A')}%",
        f"- الماء: {current_measurement.get('water_ratio', 'N/A')}%",
        f"- العضلات: {current_measurement.get('muscle_mass_kg', 'N/A')} كغ",
        f"- معدل القلب: {current_measurement.get('heart_rate', 'N/A')} نبضة/دقيقة",
    ])
    
    # التنبيهات المُكتشفة
    alerts_text = "\n".join([
        f"- [{a.get('severity', '').upper()}] {a.get('title', '')}"
        for a in alerts
    ]) if alerts else "لا توجد تنبيهات"
    
    # الأعراض
    symptoms_text = "لا أعراض مسجلة"
    if symptoms:
        symptom_parts = []
        if symptoms.get("headache_level"):
            symptom_parts.append(f"صداع: {symptoms['headache_level']}/10")
        if symptoms.get("swelling_level"):
            symptom_parts.append(f"تورم: {symptoms['swelling_level']}/10")
        if symptoms.get("fatigue_level"):
            symptom_parts.append(f"تعب: {symptoms['fatigue_level']}/10")
        if symptoms.get("blurred_vision"):
            symptom_parts.append("تشوش رؤية")
        if symptoms.get("shortness_of_breath"):
            symptom_parts.append("صعوبة تنفس")
        if symptoms_parts := symptom_parts:
            symptoms_text = "، ".join(symptoms_parts)
    
    prompt = f"""أنت مساعد طبي ذكي متخصص في تحليل بيانات الميزان الصحي الذكي.

معلومات المستخدم:
{chr(10).join(context_parts)}

القياسات الجديدة:
{measurement_text}

الأعراض اليوم:
{symptoms_text}

التنبيهات المُكتشفة:
{alerts_text}

التحليل مطلوب باللغة العربية ويشمل:
1. **ملخص القياسات**: تفسير واضح وبسيط للأرقام
2. **المقارنة بالسابق**: هل هناك تحسن أو تراجع؟
3. **النقطة الأهم اليوم**: أبرز شيء يجب أن يعرفه المستخدم
4. **توصية واحدة عملية**: شيء واحد يمكنه فعله اليوم

أسلوب الكتابة: واضح، دافئ، غير مخيف، طبي لكن مفهوم للعامة.
الطول: 150-200 كلمة فقط.
"""
    
    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return "تعذّر إجراء التحليل الذكي حالياً. يرجى المحاولة لاحقاً."