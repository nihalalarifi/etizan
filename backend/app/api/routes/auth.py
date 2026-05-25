from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
from typing import Optional
import bcrypt
import jwt
import uuid

from app.db.database import get_db
from app.models.models import User, HealthProfile
from app.core.config import settings
from app.services.withings_service import withings_service

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ─── Schemas ────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    gender: str  # male | female
    birthdate: Optional[str] = None
    height_cm: Optional[float] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    gender: str


class WithingsConnectResponse(BaseModel):
    auth_url: str


# ─── Helpers ─────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """تسجيل مستخدم جديد"""
    
    # التحقق من عدم وجود البريد مسبقاً
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل مسبقاً")
    
    if data.gender not in ("male", "female"):
        raise HTTPException(status_code=400, detail="الجنس يجب أن يكون male أو female")
    
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        name=data.name,
        gender=data.gender,
        height_cm=data.height_cm,
    )
    
    if data.birthdate:
        try:
            user.birthdate = datetime.strptime(data.birthdate, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="تنسيق التاريخ خاطئ (YYYY-MM-DD)")
    
    db.add(user)
    await db.flush()
    
    # إنشاء ملف صحي فارغ
    profile = HealthProfile(user_id=user.id)
    db.add(profile)
    
    await db.commit()
    await db.refresh(user)
    
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        user_id=str(user.id),
        name=user.name,
        gender=user.gender,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """تسجيل الدخول"""
    result = await db.execute(select(User).where(User.email == form.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        user_id=str(user.id),
        name=user.name,
        gender=user.gender,
    )


@router.get("/withings/connect", response_model=WithingsConnectResponse)
async def withings_connect(current_user: User = Depends(get_current_user)):
    """الحصول على رابط ربط Withings"""
    auth_url = withings_service.get_authorization_url(state=str(current_user.id))
    return WithingsConnectResponse(auth_url=auth_url)


@router.get("/withings/callback")
async def withings_callback(
    code: str,
    state: str,  # user_id
    db: AsyncSession = Depends(get_db),
):
    """استقبال callback من Withings بعد الموافقة"""
    
    result = await db.execute(select(User).where(User.id == state))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    try:
        tokens = await withings_service.exchange_code_for_tokens(code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"خطأ في ربط Withings: {e}")
    
    # حفظ التوكنز
    user.withings_access_token = tokens["access_token"]
    user.withings_refresh_token = tokens["refresh_token"]
    user.withings_token_expires_at = tokens["expires_at"]
    user.withings_user_id = tokens["withings_user_id"]
    user.withings_connected = True
    
    # الاشتراك في Webhooks
    await withings_service.subscribe_webhook(
        access_token=tokens["access_token"],
        user_id=str(user.id),
    )
    
    # جلب القياسات التاريخية (آخر 90 يوم)
    from datetime import timedelta
    from app.api.routes.measurements import sync_historical_measurements
    
    await sync_historical_measurements(
        user=user,
        db=db,
        days_back=90,
    )
    
    await db.commit()
    
    return {"message": "تم ربط Withings بنجاح!", "withings_user_id": tokens["withings_user_id"]}


@router.post("/withings/disconnect")
async def withings_disconnect(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """قطع الاتصال مع Withings"""
    current_user.withings_access_token = None
    current_user.withings_refresh_token = None
    current_user.withings_user_id = None
    current_user.withings_connected = False
    await db.commit()
    return {"message": "تم قطع الاتصال مع Withings"}
