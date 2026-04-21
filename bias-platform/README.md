# BiasAudit — AI Bias Detection & Auditing Platform

A web application that helps organisations inspect CSV datasets for hidden bias or discrimination before their systems affect real people.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| pnpm / npm | any |
| Python | 3.10+ |
| PostgreSQL | 14+ |

---

## Local Setup

### 1. Clone and enter the project

```bash
cd bias-platform
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `PYTHON_SERVICE_URL` | `http://localhost:8000` (default) |
| `UPLOAD_DIR` | Absolute path where CSVs are stored, e.g. `/tmp/bias-uploads` |

### 4. Initialise the database

```bash
npx prisma db push        # create tables
npx prisma generate       # generate Prisma client
```

### 5. Set up the Python microservice

```bash
cd python-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

---

## Running the Application

Open **two terminal windows**:

**Terminal 1 — Next.js (from `bias-platform/`)**

```bash
npm run dev
```

Starts on [http://localhost:3000](http://localhost:3000)

**Terminal 2 — Python microservice (from `bias-platform/python-service/`)**

```bash
source .venv/bin/activate
UPLOAD_DIR=/absolute/path/to/uploads uvicorn main:app --reload --port 8000
```

Set `UPLOAD_DIR` to the same value as in `.env`.

The microservice health check is available at [http://localhost:8000/health](http://localhost:8000/health).

---

## Usage

1. Navigate to [http://localhost:3000](http://localhost:3000) and create an account.
2. Click **New Audit** → drag-and-drop a CSV file (max 50 MB).
3. Select the **target column** (the outcome your model predicts) and one or more **protected attributes** (gender, race, age group, etc.).
4. Click **Run Bias Analysis** and wait 5–15 seconds.
5. Review the **risk score**, **metrics table**, and **recommended fixes**.
6. Export as PDF or return to the **Audit History** dashboard.

---

## Environment Variables Reference

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/bias_platform"

# NextAuth session signing key
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<random 32-byte base64 string>"

# Python microservice base URL
PYTHON_SERVICE_URL="http://localhost:8000"

# Directory where uploaded CSVs are saved
UPLOAD_DIR="./uploads"
```

---

## Architecture

```
Browser → Next.js (App Router, port 3000)
              │
              ├─ API routes
              │     ├─ /api/auth/*        NextAuth.js (JWT)
              │     ├─ /api/upload        Saves CSV, runs Node.js CSV profiler
              │     ├─ /api/analyze       Calls Python service, stores results
              │     └─ /api/audits/*      CRUD for audit history
              │
              └─ Python microservice (FastAPI, port 8000)
                    └─ POST /analyze      pandas + scipy bias metrics
```

---

## Fairness Metrics

| Metric | Threshold | Meaning |
|---|---|---|
| Demographic Parity Difference | < 0.10 | Difference in positive-outcome rate between groups |
| Equalized Odds Difference | < 0.10 | Max difference in TPR / FPR between groups |
| Disparate Impact Ratio | ≥ 0.80 | 80% rule (EEOC): min/max positive-rate ratio |
| χ² p-value | ≥ 0.05 | Statistical significance of outcome disparity |

Risk level:
- **Low** — no metrics breached
- **Medium** — one attribute flagged, no severe disparity
- **High** — two+ attributes flagged, or disparate impact < 0.70
