# Etizan — AI-Powered Smart Scale Health Platform

A full-stack health monitoring platform that integrates with the Withings Body Smart scale to track body composition measurements and uses Google Gemini AI to generate personalized health analysis. Built with three specialized medical analyzers for general health, pregnancy, and kidney disease — each producing condition-specific alerts based on the user's health profile.

## Why We Built This

Standard smart scale apps show you numbers but never tell you what they mean for your specific situation. A 2 kg weight gain means something completely different for a pregnant woman, a dialysis patient, or a healthy adult. We built Etizan to bridge that gap — pulling real body composition data from a medical-grade scale and running it through health-condition-aware logic that gives users actually useful feedback rather than raw metrics.

## Features

- **Withings OAuth2 integration** — connects to the Withings Body Smart scale via the official API, pulling weight, BMI, fat ratio, muscle mass, bone mass, heart rate, hydration, and visceral fat in real time via webhooks
- **Three specialized AI analyzers** — separate analysis engines for general health, pregnancy, and kidney/dialysis patients, each with condition-specific alert thresholds and logic
- **Google Gemini AI health summaries** — natural language health insights generated from the user's full body composition profile
- **Alert system** — categorized alerts (info / warning / critical) for fluid retention, BMI changes, fat ratio trends, heart rate anomalies, and muscle loss
- **Symptom logging** — users can log daily symptoms that feed into the health analysis
- **JWT authentication** — secure token-based auth with a 7-day session
- **Dockerized deployment** — single `docker-compose up` starts the entire stack (PostgreSQL, FastAPI backend, React frontend)
- **Async backend** — built on async SQLAlchemy and FastAPI for high-performance non-blocking I/O

## Tech Stack

| Technology | Purpose |
|---|---|
| FastAPI (Python) | Async REST API backend |
| SQLAlchemy (async) | ORM with PostgreSQL |
| PostgreSQL | Relational database |
| Alembic | Database migrations |
| Google Gemini AI | Natural language health analysis |
| Withings API | Smart scale OAuth2 integration and webhooks |
| React 18 | Frontend single-page app |
| Vite | Frontend build tool |
| Docker + Docker Compose | Containerized deployment |
| PyJWT + bcrypt | Authentication and password hashing |

## Project Structure

```
etizan/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app entry point
│   │   ├── core/config.py             # Settings loaded from .env
│   │   ├── db/database.py             # Async database engine and session
│   │   ├── models/models.py           # SQLAlchemy models
│   │   ├── services/withings_service.py  # Withings OAuth2 and API client
│   │   ├── analysis/
│   │   │   ├── general_analyzer.py    # BMI, fat, heart rate, hydration analysis
│   │   │   ├── pregnancy_analyzer.py  # Pregnancy-specific health logic
│   │   │   └── kidney_analyzer.py     # Kidney/dialysis fluid retention logic
│   │   └── api/routes/
│   │       ├── auth.py                # Register, login, JWT
│   │       ├── users.py               # User profile and health settings
│   │       ├── measurements.py        # Body composition data endpoints
│   │       ├── analysis.py            # AI analysis triggers
│   │       ├── alerts.py              # Alert retrieval and management
│   │       ├── symptoms.py            # Symptom logging
│   │       └── webhooks.py            # Withings webhook receiver
│   ├── seed_data.py                   # Database seeding script
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # All screens and routing
│   │   └── main.jsx                   # React entry point
│   ├── public/Etizan-logo.png
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Installation & Setup

### Prerequisites

- Docker and Docker Compose installed
- A Withings developer account — register at https://developer.withings.com to get `WITHINGS_CLIENT_ID` and `WITHINGS_CLIENT_SECRET`
- A Google Gemini API key — get one at https://aistudio.google.com

### Quick Start with Docker (recommended)

```bash
# 1. Clone the repository
git clone https://github.com/nihalalarifi/etizan.git
cd etizan

# 2. Set up environment variables
cp .env.example .env
# Edit .env and fill in all values

# 3. Start the full stack
docker-compose up --build

# Services will be available at:
#   Frontend:  http://localhost:3000
#   Backend:   http://localhost:8000
#   API Docs:  http://localhost:8000/docs
```

### Manual Setup (without Docker)

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # fill in values
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the following:

```
SECRET_KEY=             # Generate with: python3 -c "import secrets; print(secrets.token_hex(32))"
DATABASE_URL=           # PostgreSQL connection string
WITHINGS_CLIENT_ID=     # From Withings developer portal
WITHINGS_CLIENT_SECRET= # From Withings developer portal
WITHINGS_REDIRECT_URI=  # Must match what you registered in the Withings portal
GEMINI_API_KEY=         # From Google AI Studio
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login and receive JWT |
| GET | /api/users/me | Current user profile |
| GET | /api/measurements | Body composition history |
| POST | /api/measurements | Add a manual measurement |
| GET | /api/analysis/latest | Get latest AI health analysis |
| POST | /api/analysis/trigger | Trigger a new analysis |
| GET | /api/alerts | List all health alerts |
| POST | /api/symptoms | Log daily symptoms |
| POST | /api/webhooks/withings | Withings scale data receiver |
| GET | /health | Health check |

## Technical Challenge

The hardest problem was designing the three-way analyzer system so that each condition's logic stays isolated without duplicating the shared Withings data parsing.

The scale sends 15+ body composition metrics in a single payload. Each analyzer (general, pregnancy, kidney) needed access to the same parsed measurement but had to apply completely different thresholds and alert logic — for example, fluid retention of 1.5 kg is a warning for general users but a critical emergency for a kidney dialysis patient.

The solution was a shared `AlertResult` dataclass defined in the pregnancy analyzer and imported by all three, with a dispatcher in the analysis route that checks the user's health profile and routes the measurement to the correct analyzer. This kept each analyzer self-contained and made it straightforward to add new condition-specific analyzers later without touching the shared infrastructure.

## License

MIT
