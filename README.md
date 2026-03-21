# RushCart

RushCart is a production-oriented hyperlocal, multi-vendor commerce platform. It combines a FastAPI backend, a React frontend, and a dedicated delivery microservice for live tracking.

## Highlights

- Role-based experience: buyer, seller, delivery partner, admin
- Hyperlocal store discovery + fast checkout flow
- Orders, delivery operations, returns/refunds, payouts
- Elasticsearch-backed search with DB fallback
- Image uploads via ImageKit CDN (URLs stored in DB)
- No Alembic migrations (schema created on startup)

## Monorepo Structure

```
E-Commerce/
├── Backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/routes/      # Route modules by domain
│   │   ├── services/        # Service-layer business logic
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── core/            # Config, logging, security
│   │   ├── db/              # Postgres/Redis/Mongo adapters
│   │   └── utils/           # Upload, email, JWT, cache helpers
│   ├── tests/
│   └── uploads/
├── Frontend/                # React app (Vite)
│   └── src/
│       ├── pages/           # Buyer/Seller/Admin/Delivery screens
│       ├── api/             # Axios API clients
│       ├── store/           # Zustand stores
│       └── utils/           # Media URL resolvers and helpers
├── Delivery-Service/        # Node.js + Socket.IO realtime service
└── README.md
```

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

## Core Capabilities

### Buyer
- Auth: register/login/refresh/logout + password reset
- Home, product listing/detail, category pages, store pages
- Cart (guest localStorage + sync after login)
- Checkout, order placement, order details, cancel/return, order tracking
- Wallet view, review submission

### Seller
- Onboarding + KYC submission (file upload support)
- Approval status flow
- Product CRUD + image upload
- Order management + status updates
- Earnings, commission, subscription status

### Delivery Partner
- Available deliveries feed
- Claim/assigned delivery workflows
- Pickup + delivery confirmation
- Route context + navigation map
- Location tracking updates
- Earnings summary

### Admin
- Seller approval + KYC review
- User management (block/unblock)
- Order monitoring
- Return approvals + refund control
- Commission configuration
- Revenue analytics + reports
- Banner management
- Subscription plan management

## Buyer Order Flow

Browse → Add to Cart → Checkout → Place Order → Delivery Tracking

## Subscription Flow

1) Admin creates subscription plans
- `POST /api/v1/subscriptions` (admin only)

2) Seller views plans
- `GET /api/v1/subscriptions`

3) Seller activates plan
- `POST /api/v1/subscriptions/activate/{plan_id}`

If `ENFORCE_SELLER_SUBSCRIPTION=true`, product creation is blocked until a plan is active.

## Tech Stack

### Backend
- FastAPI + async SQLAlchemy + asyncpg
- PostgreSQL
- Redis
- Elasticsearch
- JWT auth
- Razorpay integration
- Gmail SMTP email sender

### Frontend
- React + Vite
- Tailwind CSS
- Zustand
- React Router
- Axios
- Swiper
- Leaflet (maps)

### Delivery Service
- Node.js + Express
- Socket.IO
- OSRM routing

## Environment Configuration

Create env files before running locally.

### Backend `.env`

```
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
REFRESH_TOKEN_EXPIRE_DAYS=30
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

EMAILS_ENABLED=false
SMTP_HOST=smtp.gmail.com
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

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

GOOGLE_CLIENT_ID=
```

### Frontend `.env`

```
VITE_API_URL=http://localhost:8000/api/v1
VITE_DELIVERY_SERVICE_URL=http://localhost:4001
VITE_GOOGLE_CLIENT_ID=
```

### Delivery Service `.env`

```
PORT=4001
ALLOWED_ORIGINS=http://localhost:5173
```

## Run Services Locally

### 1) Start infra dependencies
- PostgreSQL
- Redis
- Elasticsearch

### 2) Backend

```
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3) Frontend

```
cd Frontend
npm install
npm run dev
```

### 4) Delivery Service

```
cd Delivery-Service
npm install
npm run dev
```

## Database Strategy (No Alembic)

This project intentionally does **not** use Alembic migrations.

Current behavior:
- Schema is created on startup via `Base.metadata.create_all()`.
- Default admin user is seeded on startup using `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Production note: for controlled schema evolution, introduce a migration workflow.

## API Surface

Base prefix: `/api/v1`

Major route groups:
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

OpenAPI:
- Swagger UI: `/docs`
- ReDoc: `/redoc`

## Search

- Primary: Elasticsearch
- Fallback: DB search when ES is unavailable

## Uploads & Media

- Product images and KYC documents are uploaded via ImageKit (when keys are set).
- Image URLs are stored in the database.

## Troubleshooting

- **Active subscription required** when creating products
  - Create a plan as admin → seller activates plan → create products
  - Or set `ENFORCE_SELLER_SUBSCRIPTION=false` in dev

- **Category page empty**
  - Ensure products have valid `category` values
  - Categories are derived from product data

- **Delivery map/route errors**
  - Ensure Delivery-Service is running on port 4001
  - Verify `VITE_DELIVERY_SERVICE_URL`

---

For deeper implementation details:
- Backend: `Backend/`
- Frontend: `Frontend/`
- Delivery service: `Delivery-Service/`
