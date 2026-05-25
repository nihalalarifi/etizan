"""
Withings API Service
يتعامل مع OAuth2 وجلب القياسات وإعداد Webhooks
"""
import httpx
from datetime import datetime, timedelta
from urllib.parse import urlencode
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Withings measure types
MEASURE_TYPES = {
    1: "weight_kg",
    4: "height_m",
    5: "fat_ratio",        # % الدهون
    6: "fat_mass_kg",      # كتلة الدهون
    8: "fat_free_mass_kg", # الكتلة الخالية من الدهون
    11: "heart_rate",      # معدل ضربات القلب
    76: "muscle_mass_kg",  # كتلة العضلات
    77: "bone_mass_kg",    # كتلة العظام
    88: "water_ratio",     # % الماء ⭐
    155: "visceral_fat",   # الدهون الحشوية
    168: "vascular_age",   # العمر الوعائي
    169: "nerve_health",   # صحة الأعصاب
    170: "extracellular_water", # الماء خارج الخلايا
    171: "intracellular_water", # الماء داخل الخلايا
}

# Webhook application types
WEBHOOK_APPLI = {
    1: "weight",    # القياسات الجسدية
    4: "heart",     # ضربات القلب
    44: "sleep",    # النوم
    54: "activity", # النشاط
}


class WithingsService:
    
    def get_authorization_url(self, state: str) -> str:
        """توليد رابط OAuth2 للمستخدم"""
        params = {
            "response_type": "code",
            "client_id": settings.WITHINGS_CLIENT_ID,
            "redirect_uri": settings.WITHINGS_REDIRECT_URI,
            "scope": "user.metrics,user.activity,user.info",
            "state": state,
        }
        return f"{settings.WITHINGS_AUTH_URL}?{urlencode(params)}"
    
    async def exchange_code_for_tokens(self, code: str) -> dict:
        """تبادل authorization code بـ access/refresh tokens"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.WITHINGS_TOKEN_URL,
                data={
                    "action": "requesttoken",
                    "grant_type": "authorization_code",
                    "client_id": settings.WITHINGS_CLIENT_ID,
                    "client_secret": settings.WITHINGS_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.WITHINGS_REDIRECT_URI,
                },
            )
        
        data = response.json()
        if data.get("status") != 0:
            raise ValueError(f"Withings OAuth error: {data}")
        
        body = data["body"]
        return {
            "access_token": body["access_token"],
            "refresh_token": body["refresh_token"],
            "expires_at": datetime.utcnow() + timedelta(seconds=body["expires_in"]),
            "withings_user_id": str(body["userid"]),
        }
    
    async def refresh_token(self, refresh_token: str) -> dict:
        """تجديد access token منتهي الصلاحية"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.WITHINGS_TOKEN_URL,
                data={
                    "action": "requesttoken",
                    "grant_type": "refresh_token",
                    "client_id": settings.WITHINGS_CLIENT_ID,
                    "client_secret": settings.WITHINGS_CLIENT_SECRET,
                    "refresh_token": refresh_token,
                },
            )
        
        data = response.json()
        if data.get("status") != 0:
            raise ValueError(f"Withings token refresh error: {data}")
        
        body = data["body"]
        return {
            "access_token": body["access_token"],
            "refresh_token": body["refresh_token"],
            "expires_at": datetime.utcnow() + timedelta(seconds=body["expires_in"]),
        }
    
    async def get_measurements(
        self,
        access_token: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> list[dict]:
        """جلب قياسات المستخدم من Withings"""
        
        params = {"action": "getmeas", "meastypes": "1,5,6,8,11,76,77,88,155"}
        
        if start_date:
            params["startdate"] = int(start_date.timestamp())
        if end_date:
            params["enddate"] = int(end_date.timestamp())
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.WITHINGS_API_URL}/measure",
                headers={"Authorization": f"Bearer {access_token}"},
                params=params,
            )
        
        data = response.json()
        if data.get("status") != 0:
            raise ValueError(f"Withings API error: {data}")
        
        return self._parse_measurements(data["body"]["measuregrps"])
    
    def _parse_measurements(self, measure_groups: list) -> list[dict]:
        """تحويل بيانات Withings الخام إلى تنسيق منظم"""
        parsed = []
        
        for group in measure_groups:
            measurement = {
                "measured_at": datetime.fromtimestamp(group["date"]),
                "raw_data": group,
            }
            
            for measure in group.get("measures", []):
                measure_type = measure.get("type")
                field_name = MEASURE_TYPES.get(measure_type)
                
                if field_name:
                    value = measure["value"] * (10 ** measure["unit"])
                    measurement[field_name] = round(value, 3)
            
            # حساب BMI إذا كان الوزن متاحاً
            if "weight_kg" in measurement:
                parsed.append(measurement)
        
        return parsed
    
    async def subscribe_webhook(self, access_token: str, user_id: str) -> bool:
        """الاشتراك في Webhooks لاستقبال القياسات فوراً"""
        callback_url = f"{settings.WITHINGS_REDIRECT_URI.replace('/callback', '')}/api/webhooks/withings/{user_id}"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.WITHINGS_API_URL}/notify",
                headers={"Authorization": f"Bearer {access_token}"},
                data={
                    "action": "subscribe",
                    "callbackurl": callback_url,
                    "appli": 1,  # Weight measurements
                    "comment": f"SmartScale user {user_id}",
                },
            )
        
        data = response.json()
        success = data.get("status") == 0
        if not success:
            logger.error(f"Webhook subscription failed: {data}")
        return success
    
    async def get_user_info(self, access_token: str) -> dict:
        """جلب معلومات المستخدم من Withings"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.WITHINGS_API_URL}/v2/user",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"action": "getdevice"},
            )
        return response.json().get("body", {})


withings_service = WithingsService()
