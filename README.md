# BIDGUARD AI — AI-Powered Procurement Compliance & Assurance System

Enterprise-grade, full-stack procurement compliance verification and assurance intelligence platform tailored for GeM (Government e-Marketplace) tenders.

BIDGUARD AI performs evidence-backed clause verification, statutory entity checks (PAN, GSTIN, UDYAM), audited financial threshold validation, and risk analysis grounded in submitted vendor documentation.

---

## Architecture Overview

- **Frontend**: React 19, Vite, Tailwind CSS, React Router v7, Recharts, Lucide React, and a cohesive design system following government-tech/enterprise SaaS aesthetics.
- **Backend**: Python 3.12+, FastAPI, SQLAlchemy ORM, Alembic migrations, Pydantic V2, PyJWT, Bcrypt password hashing.
- **Database**: PostgreSQL (with SQLite zero-config fallback for isolated unit testing).
- **Document Processing**: `pypdf` (multi-page PDF text extraction), `python-docx` (DOCX parsing), `openpyxl` (XLSX data sheets), and CSV ingestion.
- **Reporting Engine**: ReportLab PDF document compilation and RFC-4180 CSV exports.
- **Governance**: Persistent, tamper-evident audit logs and live database-backed notification triggers.

---

## Project Structure

```
BIDGUARD_AI_INTEGRATED/
├── backend/
│   ├── alembic/                 # Alembic database migrations
│   │   ├── versions/            # Version migration scripts
│   │   └── env.py               # Alembic environment configuration
│   ├── app/
│   │   ├── models/              # SQLAlchemy database models
│   │   │   ├── user.py          # User & UserSettings
│   │   │   ├── bid.py           # BidCase & BidRequirement
│   │   │   ├── document.py      # Document & evidence metadata
│   │   │   ├── analysis.py      # AnalysisRun, ComplianceFinding, RiskAlert
│   │   │   ├── report.py        # GeneratedReport
│   │   │   ├── notification.py  # User notifications
│   │   │   └── audit.py         # Persistent AuditLog
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── services/            # Core business logic
│   │   │   ├── extractor.py     # Multi-format document text/entity parser
│   │   │   ├── engine.py        # Deterministic compliance verification engine
│   │   │   ├── reporter.py      # PDF & CSV generation service
│   │   │   └── audit.py         # Audit logging helper
│   │   ├── routers/             # Versioned REST API endpoints
│   │   │   ├── auth.py          # /api/v1/auth (Register, Login, Password Reset)
│   │   │   ├── profile.py       # /api/v1/profile, /api/v1/settings
│   │   │   ├── dashboard.py     # /api/v1/dashboard (Live DB metrics & trends)
│   │   │   ├── bids.py          # /api/v1/bids (CRUD & requirements)
│   │   │   ├── documents.py     # /api/v1/documents (Upload, extract, download)
│   │   │   ├── analysis.py      # /api/v1/analysis (AI verification runs)
│   │   │   ├── risks.py         # /api/v1/risks (Exceptions & reviewer notes)
│   │   │   ├── evidence.py      # /api/v1/evidence (Citations & drawer)
│   │   │   ├── reports.py       # /api/v1/reports (PDF/CSV compilation)
│   │   │   ├── audit.py         # /api/v1/audit-logs
│   │   │   ├── notifications.py # /api/v1/notifications
│   │   │   └── demo.py          # Sample showcase & government adapters
│   │   ├── config.py            # Pydantic Settings & environment variables
│   │   ├── database.py          # Engine, sessionmaker, Base, DB dependency
│   │   ├── security.py          # Bcrypt hashing & PyJWT token handling
│   │   └── main.py              # FastAPI app & SPA static file server
│   ├── tests/                   # Automated pytest suite
│   │   ├── conftest.py          # Test fixtures and DB isolation
│   │   └── test_all_workflows.py# Comprehensive workflow tests
│   ├── storage/                 # Secure document storage & generated reports
│   │   ├── uploads/
│   │   └── reports/
│   ├── requirements.txt         # Production backend dependencies
│   └── .env                     # Local environment settings
├── frontend/
│   ├── src/
│   │   ├── api/                 # Authenticated API client (token interceptors)
│   │   ├── context/             # React AuthContext (JWT session management)
│   │   ├── components/          # Reusable UI component library
│   │   │   ├── Sidebar.jsx      # Navigation sidebar with all 11 modules
│   │   │   ├── Topbar.jsx       # Global search, notifications, profile menu
│   │   │   ├── Breadcrumbs.jsx  # Location hierarchy
│   │   │   ├── StatusBadge.jsx  # Color-coded compliant/review/fail badges
│   │   │   ├── StatCard.jsx     # Dashboard metric cards
│   │   │   ├── ComplianceRing.jsx# Circular SVG score gauge
│   │   │   ├── EvidenceDrawer.jsx# Slide-over verbatim citation viewer
│   │   │   └── EmptyState.jsx   # Consistent empty states
│   │   └── pages/               # Enterprise page views
│   │       ├── Login.jsx        # Database credential verification
│   │       ├── Signup.jsx       # Multi-tenant account registration
│   │       ├── ForgotPassword.jsx# Single-use reset token request
│   │       ├── ResetPassword.jsx# Token-verified password reset
│   │       ├── Dashboard.jsx    # Real-time metrics & performance chart
│   │       ├── BidCases.jsx     # Comprehensive bid case CRUD & filter
│   │       ├── CreateBidCase.jsx# Validated tender creation form
│   │       ├── UploadDocuments.jsx# Drag-and-drop multi-file uploader
│   │       ├── BidAnalysis.jsx  # Deterministic compliance verification
│   │       ├── ComplianceMatrix.jsx# Clause-by-clause evaluation & filters
│   │       ├── RiskAlerts.jsx   # Prioritized exception & review workflow
│   │       ├── Evidence.jsx     # Document citation library
│   │       ├── Reports.jsx      # PDF & CSV dossier generation & downloads
│   │       ├── AuditTrail.jsx   # Immutable activity log
│   │       ├── Profile.jsx      # User profile & verified password change
│   │       └── Settings.jsx     # Preferences & alert thresholds
│   ├── package.json
│   └── vite.config.js
├── .env.example                 # Root configuration template
└── README.md
```

---

## Quick Start Guide

### 1. Prerequisites
- Python 3.11 or higher
- Node.js 18+ and npm (only needed if developing or rebuilding the frontend)
- PostgreSQL (optional: automatically connects if configured, or falls back to SQLite)

### 2. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

Example configuration (`backend/.env`):
```env
PROJECT_NAME="BIDGUARD AI"
VERSION="2.0.0"
ENVIRONMENT="production"

# PostgreSQL connection (fallback to SQLite if unavailable):
DATABASE_URL="postgresql://postgres:1234@localhost:5432/bidguard"

# Security:
JWT_SECRET="replace-with-a-secure-random-32-char-key-in-production"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Storage:
STORAGE_DIR="storage"
MAX_UPLOAD_SIZE_MB=25

# Allowed CORS origins:
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173","http://127.0.0.1:8000","http://localhost:8000"]
```

### 3. Backend Setup
In a terminal, navigate to `backend`:
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

Run database migrations:
```bash
alembic upgrade head
```

Start the FastAPI application:
```bash
uvicorn app.main:app --reload --port 8000
```

The backend serves the API and pre-compiled frontend:
- **Application UI**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/health`

### 4. Frontend Development (Optional)
If you wish to run the Vite dev server with Hot Module Reloading:
```bash
cd frontend
npm install
npm run dev
```
Open `http://127.0.0.1:5173` (Vite dev server proxies `/api` requests to port 8000).

To compile production assets:
```bash
npm run build
```

---

## User Onboarding & Demo Walkthrough

1. Open `http://127.0.0.1:8000/signup`.
2. Register a new account with your name, ministry/organization, official email, and a password (minimum 8 characters).
3. Log in at `http://127.0.0.1:8000/login` with your registered credentials.
4. The dashboard displays an empty, clean state for the new user.
5. Click **"Load GeM Sample Case"** on the dashboard or **"Create Bid Case"** to create a case from scratch.
6. Upload tender documents (PDF, DOCX, XLSX, CSV, TXT) via the drag-and-drop uploader.
7. Click **"Run AI Analysis"** to execute clause verification against extracted document text.
8. Review the **Compliance Matrix**, drill into verbatim proof via the **Evidence Drawer**, review **Risk Alerts**, and download official **PDF/CSV Reports**.
9. Audit logs and notifications record every milestone with cryptographic integrity.

---

## Running Automated Tests

Run the complete test suite:
```bash
cd backend
pytest -v
```

All tests execute in isolated environments with zero test pollution.
# BIDGUARD_AI_INTEGRATED
