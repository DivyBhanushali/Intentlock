# IntentLock Docker Orchestration

This directory contains the production-ready containerization files for running the full **IntentLock** system (FastAPI Security Engine + Next.js Security Dashboard) with a single command.

---

## Architecture in Docker

```
                ┌────────────────────────────────────────┐
                │          Host Machine (User)           │
                └───────────────────┬────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
              :3000 │                         :8000 │
                    ▼                               ▼
       ┌────────────────────────┐      ┌────────────────────────┐
       │   intentlock-dashboard  │      │   intentlock-backend   │
       │   (Next.js 16 + React) │ ───> │  (FastAPI + Policy)    │
       │   Container Port: 3000 │      │  Container Port: 8000  │
       └────────────────────────┘      └───────────┬────────────┘
                                                   │
                                                   ▼
                                        ┌──────────────────────┐
                                        │ Volume: sqlite data  │
                                        │ /app/data/intentlock │
                                        └──────────────────────┘
```

---

## Quickstart

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.0+

### 1. Build and Start All Containers
From the `INTENTLOCK_SDK` workspace root:
```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build -d
```

### 2. Verify Services Are Running
```bash
docker compose -f infrastructure/docker/docker-compose.yml ps
```

| Service | Host URL | Description |
| :--- | :--- | :--- |
| **Dashboard** | `http://localhost:3000` | Developer Security Dashboard (React / Next.js) |
| **API Docs** | `http://localhost:8000/docs` | OpenAPI Swagger documentation |
| **API Endpoint** | `http://localhost:8000/api/v1` | Policy, Approvals, Audit & Intercept endpoints |

### 3. View Container Logs
```bash
# Stream all logs
docker compose -f infrastructure/docker/docker-compose.yml logs -f

# Backend logs only
docker compose -f infrastructure/docker/docker-compose.yml logs -f backend
```

### 4. Stop All Containers
```bash
docker compose -f infrastructure/docker/docker-compose.yml down
```

To stop and remove stored database volumes:
```bash
docker compose -f infrastructure/docker/docker-compose.yml down -v
```

---

## Environment Configuration

The containers are pre-configured with secure defaults:
- `FAIL_CLOSED=true`: Guarantees fail-closed security.
- `ENVIRONMENT=production`
- `DATABASE_URL=sqlite:////app/data/intentlock.db`
- `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`

