# INTENTLOCK 2.0 — Production Deployment & Operations Guide

## 1. Deployed Environments

INTENTLOCK 2.0 is deployed in production across two decoupled cloud hosting platforms:

| Component | Platform | Production URL | Documentation |
| :--- | :--- | :--- | :--- |
| **Backend API** | Render | `https://intentlock-backend-ze2i.onrender.com` | `/docs` (Swagger / OpenAPI 3.1) |
| **Dashboard** | Vercel | `https://intentlock-wheat.vercel.app` | Built with Next.js 16 (Turbopack) |

---

## 2. Environment Variables Specification

### 2.1 Backend (`backend/.env`)

```ini
# Application Configuration
APP_NAME=INTENTLOCK Enterprise
APP_VERSION=2.0.0
DEBUG=false
ENVIRONMENT=production

# Database Configuration (PostgreSQL in production, SQLite fallback)
DATABASE_URL=postgresql://intentlock_user:secure_password@prod-db.internal:5432/intentlock_prod

# Security & Secrets
SECRET_KEY=generate_with_openssl_rand_hex_32
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Human-in-the-Loop Approval Policy
DEFAULT_APPROVAL_TIMEOUT_SECONDS=300
FAIL_CLOSED_ON_INTERNAL_ERROR=true

# Cross-Origin Resource Sharing
CORS_ORIGINS=["https://intentlock-wheat.vercel.app", "http://localhost:3000"]
```

### 2.2 Frontend (`frontend/.env.local`)

```ini
NEXT_PUBLIC_API_URL=https://intentlock-backend-ze2i.onrender.com/api/v1
NEXT_PUBLIC_APP_ENV=production
```

---

## 3. Docker Containerization

### 3.1 Backend Dockerfile (`backend/Dockerfile`)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY sdk/python /sdk/python
RUN pip install --no-cache-dir /sdk/python

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY backend /app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 3.2 Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: intentlock
      POSTGRES_PASSWORD: secure_local_password
      POSTGRES_DB: intentlock
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    environment:
      DATABASE_URL: postgresql://intentlock:secure_local_password@db:5432/intentlock
      SECRET_KEY: test_secret_key_12345
    ports:
      - "8000:8000"
    depends_on:
      - db

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 4. Database Migrations & Initialization

In production, database tables are auto-created on application startup via `Base.metadata.create_all(bind=engine)`.

For zero-downtime schema evolution:
1. Connect to the production database: `psql $DATABASE_URL`.
2. Verify all tables: `\dt`.
3. Check sequence continuity: `SELECT org_id, max(sequence_number) FROM audit_events GROUP BY org_id;`.

---

## 5. Health Checks & Telemetry

- **Health Probe**: `GET /health` $\rightarrow$ `{"status": "ok", "version": "2.0.0"}`.
- **Audit Verification Probe**: `GET /api/v1/audit/verify` (requires JWT or API key) $\rightarrow$ verifies tamper-evident sequential hash chains.
- **Threat Engine Summary**: `GET /api/v1/threats/stats` $\rightarrow$ real-time anomaly counts.
