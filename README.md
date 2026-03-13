# RushCart

Hyperlocal multi-vendor commerce platform with a production-oriented architecture.

RushCart combines:
- `Backend` (FastAPI + PostgreSQL + Redis + Elasticsearch)
- `Frontend` (React + Vite + Tailwind + Zustand)
- `Delivery-Service` (Node.js + Socket.IO microservice for live tracking + routing)

This repository is structured as a monorepo and is designed to run either locally (service-by-service) or via Docker Compose.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Core Capabilities](#core-capabilities)
- [Monorepo Structure](#monorepo-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Run with Docker Compose (Recommended)](#run-with-docker-compose-recommended)
- [Run Services Locally (Without Docker)](#run-services-locally-without-docker)
- [Database Strategy (No Alembic)](#database-strategy-no-alembic)
- [API Surface](#api-surface)
- [Testing & Quality](#testing--quality)
- [Observability & Operations](#observability--operations)
- [Security Posture](#security-posture)
- [CI/CD & Deployment](#cicd--deployment)
- [Uploads & Media Handling](#uploads--media-handling)
- [Troubleshooting](#troubleshooting)
- [Roadmap to Full Enterprise Grade](#roadmap-to-full-enterprise-grade)

## Project Overview

RushCart is built to model real-world commerce workflows, not only demo CRUD:
- Role-aware product experience (`buyer`, `seller`, `delivery`, `admin`)
- Hyperlocal store discovery
- Cart and checkout with guest-to-authenticated cart sync
- Order lifecycle, delivery operations, returns, refunds, payout flows
- Search and discovery with Elasticsearch-first strategy and DB fallback

## Architecture

```mermaid
flowchart LR
  U["Web Client (React)"] --> B["FastAPI Backend (:8000)"]
  U --> D["Delivery Service (Node + Socket.IO :4001)"]
  B --> P["PostgreSQL"]
  B --> R["Redis"]
  B --> E["Elasticsearch"]
  D --> O["OSRM Public Routing API"]
```

### Runtime Design Principles

- Async backend (`FastAPI`, async SQLAlchemy, async Redis)
- Stateless access tokens + Redis-backed refresh/session control
- Backend-owned order integrity (pricing/product checks)
- Frontend-first UX for cart, synced to backend after auth
- API-first decomposition with a dedicated delivery realtime microservice

## Core Capabilities

### Buyer
- Auth (register/login/refresh/logout/forgot/reset password)
- Buyer home, product listing/detail, category pages, store pages
- Cart (`localStorage` for guests + server sync for logged-in users)
- Checkout, order placement, order details, cancel/return, order tracking
- Wallet view, review submission

### Seller
- Seller onboarding
- KYC submission (including document upload)
- Approval status flow
- Product CRUD + product image upload
- Order management + status updates
- Earnings, commission, subscription status

### Delivery Partner
- Available deliveries feed
- Claim/assigned delivery workflows
- Pickup and delivery confirmation
- Route context and navigation map support
- Location tracking updates (via backend and realtime service fallback)
- Earnings summary

### Admin
- Seller decisioning and KYC workflow support
- User management (block/unblock)
- Order monitoring
- Return approvals and refund control
- Commission configuration
- Revenue analytics and report export
- Banner management (homepage slider content)

## Monorepo Structure

```text
E-Commerce/
├── Backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/routes/      # Route modules by domain
│   │   ├── services/        # Service-layer business logic
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── core/            # Config, telemetry, logging, observability
│   │   ├── db/              # Postgres/Redis/Mongo adapters
│   │   └── utils/           # Upload, email, JWT, rate limiter, cache helpers
│   ├── tests/               # Backend unit/integration tests
│   ├── scripts/             # Load/resilience/failover checks
│   └── uploads/             # Uploaded files (mounted in Docker)
├── Frontend/                # React app (Vite)
│   └── src/
│       ├── pages/           # Buyer/Seller/Admin/Delivery screens
│       ├── api/             # Axios API clients
│       ├── store/           # Zustand stores
│       └── utils/           # Media URL resolvers and helpers
├── Delivery-Service/        # Node.js + Socket.IO realtime service
└── .github/workflows/       # CI, CD, security, deploy, resilience smoke
```

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy (async) + asyncpg
- PostgreSQL
- Redis
- Elasticsearch
- JWT auth (`pyjwt` + JOSE helpers)
- Razorpay integration
- SMTP email sender
- OpenTelemetry (optional), Sentry (optional)

### Frontend
- React + Vite
- Tailwind CSS
- Zustand
- React Router
- Axios
- Swiper
- Dynamic Leaflet integration (delivery map)

### Delivery Service
- Node.js + Express
- Socket.IO
- CORS controls
- OSRM route API integration

## Getting Started

### Prerequisites

- Docker + Docker Compose (recommended path)
- or local toolchain:
  - Python 3.12+
  - Node.js 20+
  - PostgreSQL 16+
  - Redis 7+
  - Elasticsearch 8.x

## Environment Configuration

Create environment files before running locally.

### Backend `.env` (required)

Add the following keys in `Backend/.env`:

```env
APP_NAME=RushCart
DEBUG=true
API_V1_STR=/api/v1
APP_ENV=development
LOG_LEVEL=INFO
LOG_JSON=true

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/rushcart
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
DB_POOL_TIMEOUT_SECONDS=30

REDIS_URL=redis://localhost:6379/0

SECRET_KEY=replace-with-at-least-32-bytes-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
RESET_TOKEN_EXPIRE_MINUTES=30
JWT_ISSUER=rushcart-auth
JWT_MIN_SECRET_LENGTH=32

BCRYPT_ROUNDS=12
CORS_ORIGINS=http://localhost:5173
TRUSTED_HOSTS=localhost,127.0.0.1
ENABLE_HSTS=false
HSTS_MAX_AGE_SECONDS=31536000
ENFORCE_SELLER_SUBSCRIPTION=true
UPLOAD_MAX_IMAGE_SIZE_MB=15

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_PRODUCTS_INDEX=rushcart_products
ELASTICSEARCH_STORES_INDEX=rushcart_stores
ELASTICSEARCH_TIMEOUT_SECONDS=5

SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.0
OTEL_ENABLED=false
OTEL_SERVICE_NAME=rushcart-backend
OTEL_EXPORTER_OTLP_ENDPOINT=
ALERT_ERROR_RATE_THRESHOLD=0.05
ALERT_P95_MS_THRESHOLD=1500
ALERT_INFLIGHT_THRESHOLD=200

EMAILS_ENABLED=false
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=RushCart
SMTP_USE_TLS=true
SMTP_USE_SSL=false
FRONTEND_URL=http://localhost:5173

ADMIN_EMAIL=admin@rushcart.local
ADMIN_PASSWORD=ChangeThisAdminPassword123!
ADMIN_NAME=RushCart Admin
```

### Frontend `.env` (optional but recommended)

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_DELIVERY_SERVICE_URL=http://localhost:4001
```

### Delivery Service `.env` (optional)

Create `Delivery-Service/.env`:

```env
PORT=4001
ALLOWED_ORIGINS=http://localhost:5173
```

## Run with Docker Compose (Recommended)

From repository root:

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Backend docs: `http://localhost:8000/docs`
- Delivery service: `http://localhost:4001`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Elasticsearch: `localhost:9200`

Stop stack:

```bash
docker compose down
```

Reset with volumes:

```bash
docker compose down -v
```

## Run Services Locally (Without Docker)

### 1) Start infra dependencies

Run PostgreSQL, Redis, Elasticsearch locally.

### 2) Backend

```bash
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3) Frontend

```bash
cd Frontend
npm install
npm run dev
```

### 4) Delivery Service

```bash
cd Delivery-Service
npm install
npm run dev
```

## Database Strategy (No Alembic)

This project intentionally does **not** use Alembic migrations.

Current strategy:
- Schema is created on startup via `Base.metadata.create_all()` in backend initialization.
- A lightweight startup migration helper normalizes old geo columns (`users/sellers latitude/longitude`) if stored as string, converting them to `DOUBLE PRECISION`.
- Default admin user is seeded on startup using `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Production note:
- For large-scale controlled schema evolution, replace/augment this with versioned migration governance.

## API Surface

Base prefix: `/api/v1`

### Major route groups
- Auth: `/auth/*`
- Users: `/users/*`
- Sellers: `/sellers/*`
- Stores: `/stores/*`
- Products: `/products/*`
- Orders: `/orders/*`
- Payments: `/payments/*`
- Delivery: `/delivery/*`
- Subscriptions: `/subscriptions/*`
- Admin: `/admin/*`
- Search: `/search/*`
- Categories: `/categories/*`
- Reviews: `/reviews/*`
- Wallet: `/wallet/*`
- Payouts: `/payouts/*`
- Commissions: `/commissions/*`
- Cart: `/cart/*`
- Banners: `/banners/*`
- System/Health/Metrics: `/system/*`

OpenAPI docs:
- Swagger UI: `/docs`
- ReDoc: `/redoc`

## Testing & Quality

### Backend tests

```bash
cd Backend
pytest -q
```

Coverage command used in CI:

```bash
pytest -q --cov=app --cov-report=term-missing --cov-fail-under=8
```

Current test modules include:
- File upload validation
- Email template/config checks
- Observability metrics behavior
- Delivery helper logic fallback behavior

### Frontend quality

```bash
cd Frontend
npm run lint
npm run build
```

### Delivery service quality

```bash
cd Delivery-Service
node --check src/server.js
```

## Observability & Operations

### Health and readiness
- `GET /api/v1/system/health/live`
- `GET /api/v1/system/health/ready`

### Metrics and alerts
- `GET /api/v1/system/metrics` (JSON)
- `GET /api/v1/system/metrics/prometheus` (Prometheus text format)
- `GET /api/v1/system/alerts` (threshold-based alert view)

### Telemetry
- Sentry support via `SENTRY_DSN`
- OpenTelemetry support via `OTEL_ENABLED` + OTLP endpoint configuration

### Performance helpers
- In-memory API caching utility for high-traffic read paths
- Redis-based rate limiting across sensitive APIs
- Search fallback strategy (Elasticsearch -> DB query)

## Security Posture

Implemented controls:
- JWT auth with minimum secret-length guard
- Refresh token lifecycle + revocation via Redis
- Role-based authorization checks
- Security headers middleware (CSP, XFO, COOP, CORP, etc.)
- CORS and trusted host controls
- Per-route rate limiting in critical endpoints
- File upload type/size/path validation
- CI security workflows:
  - `bandit`
  - `pip-audit`
  - `npm audit`
  - `trivy` filesystem scan

## CI/CD & Deployment

Workflows available in `.github/workflows`:
- `ci.yml`: backend/frontend/delivery checks + docker image build validation
- `security.yml`: SAST and dependency security scans
- `resilience.yml`: smoke load + failover checks
- `cd.yml`: publish images to GHCR
- `deploy.yml`: staging/production orchestration over SSH with health checks

## Uploads & Media Handling

Backend serves uploaded assets from:
- `/uploads/*`

Default local upload directory:
- `Backend/uploads/`

Supported image formats include:
- `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`, `.avif`

KYC documents currently allow:
- `.pdf`

Frontend media resolver normalizes:
- absolute URLs
- `/uploads/...` relative paths
- image filename-only values to product upload paths

## Troubleshooting

### 1) JWT warning about insecure key length

If you see warnings about HMAC key length, set:
- `SECRET_KEY` to at least 32 bytes.

### 2) Images fail to render (`ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`)

Ensure:
- `VITE_API_URL` points to backend origin (`http://localhost:8000/api/v1`)
- uploaded image fields store `/uploads/...` or full absolute URLs
- backend is reachable and serving `/uploads/*`

### 3) Delivery realtime errors (`localhost:4001 connection refused`)

Ensure Delivery-Service is running:

```bash
cd Delivery-Service
npm run dev
```

If service is intentionally down, frontend should fallback to backend delivery endpoints for essential flows.

### 4) Elasticsearch unavailable

Search APIs are designed to fallback to DB query paths, but startup warnings may appear in logs.

### 5) Admin account not found

Set valid `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `Backend/.env` and restart backend; admin seed runs on startup.

## Roadmap to Full Enterprise Grade

Already present:
- CI/CD image pipelines and deploy workflow scaffolding
- Security scan automation
- Observability endpoints and resilience smoke workflows
- Delivery realtime microservice pattern

Next hardening layers (recommended):
- Expand automated backend/FE/integration test coverage substantially
- Add distributed tracing backend + dashboards + alert routing
- Add blue/green or canary deployment policy with rollback automation
- Add stronger cache backend strategy (distributed cache for horizontal scale)
- Add formal DB migration governance if strict schema lifecycle control is needed
- Add chaos/load suites with SLO-based release gates

---

For sub-project specifics:
- Backend implementation details: `Backend/`
- Frontend implementation details: `Frontend/`
- Delivery realtime service details: `Delivery-Service/README.md`
