"""
Seed script - run inside backend container:
  docker compose exec backend python seed_data.py
"""
import asyncio
import uuid
from datetime import datetime, timedelta
import bcrypt
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://postgres:password@postgres:5432/smart_scale"
engine  = create_async_engine(DB_URL, echo=False)
Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

def uid():  return str(uuid.uuid4())
def day(n): return datetime.utcnow() - timedelta(days=6-n)

PW_HASH = bcrypt.hashpw(b"12345678", bcrypt.gensalt(12)).decode()

async def run():
    async with Session() as db:

        # ── حذف البيانات القديمة أولاً ────────────────────────────────────
        print("🗑️  حذف البيانات القديمة...")
        for email in ["Nasser@gmail.com", "Ali@gmail.com", "Sara@gmail.com"]:
            # جلب الـ user_id
            result = await db.execute(
                text("SELECT id FROM users WHERE email = :e"), {"e": email})
            row = result.fetchone()
            if row:
                user_id = str(row[0])
                await db.execute(text("DELETE FROM alerts WHERE user_id = :uid"), {"uid": user_id})
                await db.execute(text("DELETE FROM daily_symptoms WHERE user_id = :uid"), {"uid": user_id})
                await db.execute(text("DELETE FROM measurements WHERE user_id = :uid"), {"uid": user_id})
                await db.execute(text("DELETE FROM health_profiles WHERE user_id = :uid"), {"uid": user_id})
                await db.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})
        await db.commit()
        print("✅ تم حذف البيانات القديمة")

        # ── إنشاء IDs ──────────────────────────────────────────────────────
        nasser_id = uid()
        ali_id    = uid()
        sara_id   = uid()

        # ── Users ──────────────────────────────────────────────────────────
        print("👤 إضافة المستخدمين...")
        for uid_, email, name, gender, bd, h in [
            (nasser_id, "Nasser@gmail.com", "Nasser", "male",   datetime(1999,1,1), 175.0),
            (ali_id,    "Ali@gmail.com",    "Ali",    "male",   datetime(2000,1,1), 172.0),
            (sara_id,   "Sara@gmail.com",   "Sara",   "female", datetime(1998,1,1), 163.0),
        ]:
            await db.execute(text("""
                INSERT INTO users
                  (id,email,hashed_password,name,gender,birthdate,height_cm,
                   withings_connected,created_at,updated_at)
                VALUES
                  (:id,:email,:pw,:name,CAST(:gender AS gender_enum),:bd,:h,
                   false,now(),now())
            """), {"id":uid_,"email":email,"pw":PW_HASH,
                   "name":name,"gender":gender,"bd":bd,"h":h})
        await db.commit()

        # ── Health profiles ────────────────────────────────────────────────
        print("🏥 إضافة الملفات الصحية...")
        await db.execute(text("""
            INSERT INTO health_profiles
              (id,user_id,has_kidney_disease,on_dialysis,has_diabetes,
               has_hypertension,has_heart_disease,target_weight,activity_level,updated_at)
            VALUES (:id,:uid,false,false,false,false,false,78,
                    CAST('active' AS activity_enum),now())
        """), {"id":uid(),"uid":nasser_id})

        await db.execute(text("""
            INSERT INTO health_profiles
              (id,user_id,has_kidney_disease,on_dialysis,has_diabetes,
               has_hypertension,dry_weight_kg,activity_level,updated_at)
            VALUES (:id,:uid,true,true,false,true,70,
                    CAST('light' AS activity_enum),now())
        """), {"id":uid(),"uid":ali_id})

        ps = datetime.utcnow() - timedelta(weeks=20)
        dd = ps + timedelta(weeks=40)
        await db.execute(text("""
            INSERT INTO health_profiles
              (id,user_id,is_pregnant,pregnancy_week,pregnancy_start_date,
               pre_pregnancy_weight,expected_due_date,has_hypertension,
               activity_level,updated_at)
            VALUES (:id,:uid,true,20,:ps,62.0,:dd,false,
                    CAST('light' AS activity_enum),now())
        """), {"id":uid(),"uid":sara_id,"ps":ps,"dd":dd})
        await db.commit()

        # ── Measurements ───────────────────────────────────────────────────
        print("⚖️  إضافة القياسات...")

        # Nasser - stable healthy
        for i,w in enumerate([79.2,79.0,78.9,78.8,78.7,78.5,78.4]):
            bmi = round(w/1.75**2,1)
            await db.execute(text("""
                INSERT INTO measurements
                  (id,user_id,measured_at,weight_kg,bmi,fat_ratio,fat_mass_kg,
                   water_ratio,muscle_mass_kg,bone_mass_kg,lean_mass_kg,
                   visceral_fat,heart_rate,source,created_at)
                VALUES (:id,:uid,:at,:w,:bmi,17.5,:fm,62.0,:mm,3.2,:lm,5,68,'manual',now())
            """), {"id":uid(),"uid":nasser_id,"at":day(i),"w":w,"bmi":bmi,
                   "fm":round(w*.175,1),"mm":round(w*.42,1),"lm":round(w*.825,1)})

        # Ali - kidney / fluid overload
        for i,(w,wr) in enumerate(zip(
            [70.2,71.8,73.1,74.5,72.0,73.8,75.2],
            [55.0,57.5,59.0,61.0,56.5,58.5,62.0])):
            bmi = round(w/1.72**2,1)
            await db.execute(text("""
                INSERT INTO measurements
                  (id,user_id,measured_at,weight_kg,bmi,fat_ratio,fat_mass_kg,
                   water_ratio,muscle_mass_kg,bone_mass_kg,lean_mass_kg,
                   visceral_fat,heart_rate,source,created_at)
                VALUES (:id,:uid,:at,:w,:bmi,22.0,:fm,:wr,:mm,2.8,:lm,9,82,'manual',now())
            """), {"id":uid(),"uid":ali_id,"at":day(i),"w":w,"bmi":bmi,
                   "fm":round(w*.22,1),"wr":wr,"mm":round(w*.38,1),"lm":round(w*.78,1)})

        # Sara - pregnant week 20
        for i,(w,wr) in enumerate(zip(
            [67.8,68.1,68.5,68.9,69.3,69.6,70.2],
            [56.0,56.5,57.0,57.5,58.0,58.5,59.2])):
            bmi = round(w/1.63**2,1)
            await db.execute(text("""
                INSERT INTO measurements
                  (id,user_id,measured_at,weight_kg,bmi,fat_ratio,fat_mass_kg,
                   water_ratio,muscle_mass_kg,bone_mass_kg,lean_mass_kg,
                   visceral_fat,heart_rate,pregnancy_weight_gain,source,created_at)
                VALUES (:id,:uid,:at,:w,:bmi,28.0,:fm,:wr,:mm,2.4,:lm,6,88,:pg,'manual',now())
            """), {"id":uid(),"uid":sara_id,"at":day(i),"w":w,"bmi":bmi,
                   "fm":round(w*.28,1),"wr":wr,"mm":round(w*.35,1),
                   "lm":round(w*.72,1),"pg":round(w-62.0,1)})
        await db.commit()

        # ── Symptoms ──────────────────────────────────────────────────────
        print("🩺 إضافة الأعراض...")
        for i in range(7):
            await db.execute(text("""
                INSERT INTO daily_symptoms
                  (id,user_id,recorded_at,symptom_date,headache_level,fatigue_level,
                   nausea_level,swelling_level,mood,sleep_hours,water_intake_liters)
                VALUES (:id,:uid,:at,:sd,0,1,0,0,CAST('great' AS mood_enum),7.5,2.5)
            """), {"id":uid(),"uid":nasser_id,"at":day(i),"sd":day(i)})

            sw=4+(i%3); fat=6+(i%2); sob=i>=4
            await db.execute(text("""
                INSERT INTO daily_symptoms
                  (id,user_id,recorded_at,symptom_date,headache_level,fatigue_level,
                   nausea_level,swelling_level,decreased_urination,leg_cramps,
                   shortness_of_breath,mood,sleep_hours,water_intake_liters)
                VALUES (:id,:uid,:at,:sd,4,:fat,3,:sw,true,true,:sob,
                        CAST('bad' AS mood_enum),5.5,1.2)
            """), {"id":uid(),"uid":ali_id,"at":day(i),"sd":day(i),
                   "fat":fat,"sw":sw,"sob":sob})

            nausea=8+(i%2); swelling=6+(i%3); bv=i>=3
            await db.execute(text("""
                INSERT INTO daily_symptoms
                  (id,user_id,recorded_at,symptom_date,headache_level,fatigue_level,
                   nausea_level,swelling_level,swelling_location,upper_abdominal_pain,
                   blurred_vision,light_sensitivity,mood,sleep_hours,water_intake_liters,notes)
                VALUES (:id,:uid,:at,:sd,7,8,:nausea,:swelling,'["feet","hands"]',
                        true,:bv,true,CAST('terrible' AS mood_enum),4.5,1.8,
                        'أشعر بثقل شديد وغثيان لا يتوقف')
            """), {"id":uid(),"uid":sara_id,"at":day(i),"sd":day(i),
                   "nausea":nausea,"swelling":swelling,"bv":bv})
        await db.commit()

        # ── Alerts ────────────────────────────────────────────────────────
        print("🔔 إضافة التنبيهات...")
        all_alerts = [
            (nasser_id,"info","general_info",
             "وزنك في نطاق ممتاز",
             "أحسنت! وزنك ضمن النطاق الصحي الطبيعي. استمر في نمط حياتك النشط."),

            (ali_id,"critical","kidney_fluid_overload",
             "تراكم سوائل خطير",
             "ارتفع وزنك 5 كغ فوق الوزن الجاف في أسبوع. احتباس حاد للسوائل يستوجب تقييماً طبياً فورياً."),
            (ali_id,"warning","fluid_retention",
             "تحذير: احتباس السوائل",
             "نسبة الماء في جسمك مرتفعة. يُنصح بمراجعة طبيبك وضبط كمية السوائل اليومية."),
            (ali_id,"warning","general_warning",
             "انتبه لضغط الدم",
             "مع وجود ارتفاع ضغط الدم وأمراض الكلى، تأكد من أخذ دوائك يومياً."),

            (sara_id,"emergency","preeclampsia_risk",
             "خطر: أعراض تسمم الحمل",
             "تجمّعت لديكِ أعراض خطيرة: ألم أعلى البطن، تشوش الرؤية، تورم شديد. توجهي فوراً للطوارئ."),
            (sara_id,"critical","fluid_retention",
             "احتباس سوائل حاد",
             "تورم اليدين والقدمين مستمر أكثر من 5 أيام. راجعي طبيبك فوراً لقياس ضغط الدم وتحاليل البول."),
            (sara_id,"warning","high_weight_gain",
             "زيادة وزن أعلى من المعدل",
             "زيادة 8.2 كغ خلال 20 أسبوع. تابعي مع طبيبتك في الزيارة القادمة."),
            (sara_id,"warning","general_warning",
             "الغثيان الشديد المستمر",
             "مستوى الغثيان مرتفع لأكثر من أسبوع. تأكدي من الترطيب الكافي واستشيري طبيبك."),
        ]

        for user_id,sev,atype,title,msg in all_alerts:
            await db.execute(text("""
                INSERT INTO alerts
                  (id,user_id,alert_type,severity,title,message,is_read,created_at)
                VALUES (:id,:uid,:atype,CAST(:sev AS severity_enum),:title,:msg,false,now())
            """), {"id":uid(),"uid":user_id,
                   "atype":atype,"sev":sev,"title":title,"msg":msg})
        await db.commit()

        print()
        print("✅  تم إدخال جميع البيانات بنجاح!")
        print()
        print("   الاسم    الإيميل              الرقم السري  الحالة")
        print("   ──────────────────────────────────────────────────────")
        print("   Nasser   Nasser@gmail.com      12345678     صحي مستقر")
        print("   Ali      Ali@gmail.com         12345678     مشاكل كلى")
        print("   Sara     Sara@gmail.com        12345678     حامل أسبوع 20")

asyncio.run(run())