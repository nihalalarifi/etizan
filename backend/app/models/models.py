import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime,
    ForeignKey, JSON, Text, CheckConstraint, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    gender = Column(Enum("male", "female", name="gender_enum"), nullable=False)
    birthdate = Column(DateTime, nullable=True)
    height_cm = Column(Float, nullable=True)
    
    # Withings
    withings_user_id = Column(String(100), nullable=True, unique=True)
    withings_access_token = Column(Text, nullable=True)
    withings_refresh_token = Column(Text, nullable=True)
    withings_token_expires_at = Column(DateTime, nullable=True)
    withings_connected = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    health_profile = relationship("HealthProfile", back_populates="user", uselist=False)
    measurements = relationship("Measurement", back_populates="user", order_by="Measurement.measured_at.desc()")
    symptoms = relationship("DailySymptom", back_populates="user")
    alerts = relationship("Alert", back_populates="user")


class HealthProfile(Base):
    __tablename__ = "health_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    
    # Pregnancy
    is_pregnant = Column(Boolean, default=False)
    pregnancy_week = Column(Integer, nullable=True)
    pregnancy_start_date = Column(DateTime, nullable=True)
    pre_pregnancy_weight = Column(Float, nullable=True)  # الوزن قبل الحمل
    expected_due_date = Column(DateTime, nullable=True)
    
    # Medical conditions
    has_kidney_disease = Column(Boolean, default=False)
    on_dialysis = Column(Boolean, default=False)
    dry_weight_kg = Column(Float, nullable=True)  # الوزن الجاف لمرضى الغسيل
    dialysis_days = Column(JSON, nullable=True)   # ["Monday", "Wednesday", "Friday"]
    last_dialysis_date = Column(DateTime, nullable=True)
    
    has_diabetes = Column(Boolean, default=False)
    diabetes_type = Column(Enum("type1", "type2", "gestational", name="diabetes_enum"), nullable=True)
    has_hypertension = Column(Boolean, default=False)
    has_heart_disease = Column(Boolean, default=False)
    
    # Goals
    target_weight = Column(Float, nullable=True)
    activity_level = Column(Enum("sedentary", "light", "moderate", "active", "very_active", name="activity_enum"), default="moderate")
    
    medications = Column(JSON, nullable=True)  # قائمة الأدوية
    notes = Column(Text, nullable=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="health_profile")


class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    measured_at = Column(DateTime, nullable=False, index=True)
    
    # Core measurements from Withings Body Smart
    weight_kg = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    fat_ratio = Column(Float, nullable=True)          # % دهون
    fat_mass_kg = Column(Float, nullable=True)        # كتلة الدهون
    water_ratio = Column(Float, nullable=True)        # % الماء ⭐
    muscle_mass_kg = Column(Float, nullable=True)     # كتلة العضلات
    bone_mass_kg = Column(Float, nullable=True)       # كتلة العظام
    lean_mass_kg = Column(Float, nullable=True)       # الكتلة الخالية من الدهون
    visceral_fat = Column(Float, nullable=True)       # الدهون الحشوية
    heart_rate = Column(Integer, nullable=True)       # معدل ضربات القلب
    
    # Derived / calculated
    pregnancy_weight_gain = Column(Float, nullable=True)  # الزيادة منذ بداية الحمل
    
    # AI Analysis
    ai_analysis = Column(Text, nullable=True)
    ai_analyzed_at = Column(DateTime, nullable=True)
    
    source = Column(String(50), default="withings")
    raw_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="measurements")
    alerts = relationship("Alert", back_populates="measurement")


class DailySymptom(Base):
    __tablename__ = "daily_symptoms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
    symptom_date = Column(DateTime, nullable=False)  # تاريخ الأعراض (يوم واحد = سجل واحد)
    
    # Pregnancy symptoms / أعراض الحمل
    headache_level = Column(Integer, CheckConstraint("headache_level BETWEEN 0 AND 10"), nullable=True)
    swelling_level = Column(Integer, CheckConstraint("swelling_level BETWEEN 0 AND 10"), nullable=True)
    swelling_location = Column(JSON, nullable=True)  # ["face", "hands", "feet"]
    nausea_level = Column(Integer, CheckConstraint("nausea_level BETWEEN 0 AND 10"), nullable=True)
    vomiting_count = Column(Integer, default=0)
    blurred_vision = Column(Boolean, default=False)
    upper_abdominal_pain = Column(Boolean, default=False)
    light_sensitivity = Column(Boolean, default=False)
    
    # General symptoms
    fatigue_level = Column(Integer, CheckConstraint("fatigue_level BETWEEN 0 AND 10"), nullable=True)
    shortness_of_breath = Column(Boolean, default=False)
    dizziness = Column(Boolean, default=False)
    chest_pain = Column(Boolean, default=False)
    
    # Diabetes related
    hypoglycemia_episode = Column(Boolean, default=False)
    hyperglycemia_episode = Column(Boolean, default=False)
    
    # Kidney related
    decreased_urination = Column(Boolean, default=False)
    leg_cramps = Column(Boolean, default=False)
    
    mood = Column(Enum("great", "good", "okay", "bad", "terrible", name="mood_enum"), nullable=True)
    sleep_hours = Column(Float, nullable=True)
    water_intake_liters = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="symptoms")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    measurement_id = Column(UUID(as_uuid=True), ForeignKey("measurements.id"), nullable=True)
    
    alert_type = Column(String(100), nullable=False)
    # preeclampsia_risk, fluid_retention, kidney_fluid_overload, low_weight_gain,
    # high_weight_gain, rapid_fluid_gain, glucose_risk, general_warning
    
    severity = Column(Enum("info", "warning", "critical", "emergency", name="severity_enum"), nullable=False)
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    recommendations = Column(JSON, nullable=True)  # قائمة التوصيات
    
    is_read = Column(Boolean, default=False)
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="alerts")
    measurement = relationship("Measurement", back_populates="alerts")
