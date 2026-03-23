# Deployment Guide — E-Commerce (NestJS + Next.js + Prisma + ML)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────────┐
│  Frontend        │    │  Backend (API)   │    │  ML Service          │
│  Next.js :3001  │───▶│  NestJS :4000   │───▶│  FastAPI :8000       │
└─────────────────┘    └────────┬────────┘    └──────────────────────┘
                                │
              ┌─────────────────┼──────────────────┐
              │                 │                  │
       ┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼──────┐
       │ PostgreSQL   │  │    Redis    │  │    MinIO     │
       │ :5432        │  │    :6379    │  │  :9000/9001  │
       └─────────────┘  └─────────────┘  └──────────────┘
                                               
              ┌──────────────────────────────────────┐
              │  Mailpit (Dev Email) :8025/:1025      │
              └──────────────────────────────────────┘
```

---

## System Requirements

| Tool | Minimum Version |
|------|----------------|
| Node.js | >= 18 (v20+ recommended) |
| npm | >= 9 |
| Docker Desktop | Latest |
| Python | >= 3.10 (ML service only) |
| Git | Any recent version |

---

## Part 1 — Local Development Setup

### Step 1: Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd ecommerce-nestjs-nextjs-prisma
```

**Install backend dependencies:**
```bash
cd backend-nestjs-prisma
npm install
```

**Install frontend dependencies:**
```bash
cd ../frontend-nestjs-prisma
npm install
```

---

### Step 2: Configure Environment Variables

#### Backend (`backend-nestjs-prisma/.env`)

Create the file `backend-nestjs-prisma/.env`:

```env
# ─── App ───────────────────────────────────────────────────────────
NODE_ENV=development
PORT=4000

# ─── Database ──────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ecommerce
DB_SYNCHRONIZE=false
DB_LOGGING=false
DB_SSL=false

# ─── JWT (min 32 chars) ─────────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION_DAYS=7

# ─── CORS ───────────────────────────────────────────────────────────
FRONTEND_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3001,http://localhost:3000

# ─── Redis ──────────────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=3600

# ─── Email (Mailpit for dev) ─────────────────────────────────────────
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@ecommerce.local

# ─── OAuth2 (optional) ──────────────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/oauth2/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:4000/api/v1/auth/oauth2/github/callback

# ─── MinIO (Object Storage) ──────────────────────────────────────────
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=ecommerce
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://localhost:9000

# ─── Rate Limiting ───────────────────────────────────────────────────
RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_MAX=10

# ─── MFA ─────────────────────────────────────────────────────────────
MFA_ISSUER=Ecommerce

# ─── Stripe (optional) ───────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### Frontend (`frontend-nestjs-prisma/.env.local`)

Create the file `frontend-nestjs-prisma/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

---

### Step 3: Start Infrastructure Services (Docker)

From the **`backend-nestjs-prisma/`** directory:

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`
- **MinIO** on `localhost:9000` (API) and `localhost:9001` (Console)
- **MinIO Init** — auto-creates the `ecommerce` bucket
- **Mailpit** on `localhost:8025` (Web UI) and `localhost:1025` (SMTP)

Verify all services are healthy:
```bash
docker compose -f docker-compose.dev.yml ps
```

---

### Step 4: Run Database Migration & Seed

From **`backend-nestjs-prisma/`**:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npx prisma migrate deploy

# (First run only) Seed the database
# Seed runs automatically on first backend startup via the seed service
```

> **Note:** The database seed runs automatically when the backend starts for the first time. It creates 67 users, 90 categories, 30 brands, 15 shops, 90 products, ~337 orders, and more.

---

### Step 5: Start the Backend

From **`backend-nestjs-prisma/`**:

```bash
npm run start:dev
```

Backend will be available at: **http://localhost:4000**  
Swagger API Docs: **http://localhost:4000/api/docs**  
Bull Queue Dashboard: **http://localhost:4000/admin/queues**

---

### Step 6: Start the Frontend

From **`frontend-nestjs-prisma/`** (in a new terminal):

```bash
npx next dev --turbopack --port 3001
```

> **Important:** Use this exact command (not `npm run dev`) to enable Turbopack and run on port 3001.

Frontend will be available at: **http://localhost:3001**

---

### Step 7: (Optional) Start the ML Recommendation Service

**Option A — Docker (recommended):**

From **`ml-recommendation-service/`**:

```bash
docker compose up -d
```

> **Warning:** The ML service's docker-compose spins up its own PostgreSQL and Redis containers. If you already have them running from the backend compose, stop ML's containers or configure the ML service to connect to the existing ones.

**Option B — Local Python:**

```bash
cd ml-recommendation-service
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create .env file
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce" > .env
echo "REDIS_URL=redis://localhost:6379/0" >> .env
echo "ML_MODEL_DIR=./ml/models" >> .env

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

ML Service API: **http://localhost:8000**  
ML Service Docs: **http://localhost:8000/docs**

---

## Service URLs Summary

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:4000 |
| Swagger Docs | http://localhost:4000/api/docs |
| Bull Queue Board | http://localhost:4000/admin/queues |
| ML Service | http://localhost:8000 |
| ML Service Docs | http://localhost:8000/docs |
| MinIO Console | http://localhost:9001 |
| MinIO API | http://localhost:9000 |
| Mailpit Web UI | http://localhost:8025 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Default Credentials

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@ecommerce.com` | `Admin123!` |
| Super Admin | `superadmin@ecommerce.com` | `Admin123!` |
| Seller (1–15) | `seller1@ecommerce.com` | `Seller123!` |
| Customer (1–50) | `customer1@gmail.com` | `Customer123!` |

### Infrastructure

| Service | Username | Password |
|---------|----------|----------|
| PostgreSQL | `postgres` | `postgres` |
| MinIO | `minioadmin` | `minioadmin` |
| Redis | — | — |
| Mailpit | — | — |

### Coupon Codes (pre-seeded)

| Code | Discount |
|------|----------|
| `WELCOME10` | 10% off |
| `SAVE20` | $20 off |
| `FREESHIP` | Free shipping |
| `SUMMER25` | 25% off |
| `VIP50` | $50 off |
| `FLASH15` | 15% off |
| `NEWYEAR30` | 30% off |

---

## Part 2 — Production Deployment (VPS / Cloud)

### Prerequisites

- A Linux server (Ubuntu 22.04 LTS recommended)
- Docker & Docker Compose installed
- Domain name with DNS pointing to server (optional but recommended)
- SSL certificate (use Let's Encrypt / Certbot)

---

### Step 1: Prepare the Server

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin
```

---

### Step 2: Create Production `.env` Files

**NEVER commit secrets to git.** Copy the `.env` template from the dev section above and update:

```env
NODE_ENV=production
PORT=4000

DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@postgres:5432/ecommerce

JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_64_CHAR_STRING

FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com

REDIS_HOST=redis
REDIS_PORT=6379

MAIL_HOST=smtp.sendgrid.net     # or your SMTP provider
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.your_api_key
MAIL_FROM=noreply@yourdomain.com

MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=CHANGE_THIS
MINIO_SECRET_KEY=CHANGE_THIS_STRONG_SECRET
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=https://minio.yourdomain.com

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### Step 3: Create Backend Dockerfile

Create `backend-nestjs-prisma/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/main"]
```

---

### Step 4: Create Frontend Dockerfile

Create `frontend-nestjs-prisma/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

> **Note:** Add `output: 'standalone'` to `next.config.js` for standalone mode:
> ```js
> const nextConfig = {
>   output: 'standalone',
>   // ...existing config
> };
> ```

---

### Step 5: Create Production `docker-compose.yml`

Create a `docker-compose.yml` at the **workspace root**:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ecommerce
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend-nestjs-prisma/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - ecommerce-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - ecommerce-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-minioadmin}
    volumes:
      - minio_data:/data
    networks:
      - ecommerce-net
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"

  minio-init:
    image: minio/mc:latest
    depends_on:
      minio:
        condition: service_healthy
    networks:
      - ecommerce-net
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 ${MINIO_ACCESS_KEY:-minioadmin} ${MINIO_SECRET_KEY:-minioadmin} &&
      mc mb --ignore-existing local/ecommerce &&
      mc anonymous set public local/ecommerce
      "

  backend:
    build:
      context: ./backend-nestjs-prisma
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: ./backend-nestjs-prisma/.env
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - MINIO_ENDPOINT=minio
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - ecommerce-net
    ports:
      - "4000:4000"

  frontend:
    build:
      context: ./frontend-nestjs-prisma
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:4000/api/v1}
    restart: unless-stopped
    env_file: ./frontend-nestjs-prisma/.env.local
    depends_on:
      - backend
    networks:
      - ecommerce-net
    ports:
      - "3000:3000"

volumes:
  postgres_data:
  redis_data:
  minio_data:

networks:
  ecommerce-net:
    driver: bridge
```

---

### Step 6: Deploy

```bash
# Clone the repo on your server
git clone <your-repo-url> /opt/ecommerce
cd /opt/ecommerce

# Set up env files
cp backend-nestjs-prisma/.env.dev backend-nestjs-prisma/.env
# Edit with production values
nano backend-nestjs-prisma/.env

cp frontend-nestjs-prisma/.env.local.example frontend-nestjs-prisma/.env.local
# Edit with production values
nano frontend-nestjs-prisma/.env.local

# Build and start all services
docker compose up -d --build

# Check logs
docker compose logs -f backend
```

---

### Step 7: Run Migrations in Production

```bash
docker compose exec backend npx prisma migrate deploy
```

---

## Part 3 — Quick Commands Reference

### Docker Infrastructure

```bash
# Start dev infrastructure
cd backend-nestjs-prisma
docker compose -f docker-compose.dev.yml up -d

# Stop dev infrastructure
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (wipe all data)
docker compose -f docker-compose.dev.yml down -v

# View logs
docker compose -f docker-compose.dev.yml logs -f postgres
docker compose -f docker-compose.dev.yml logs -f redis
```

### Backend

```bash
cd backend-nestjs-prisma

# Dev mode (with hot reload)
npm run start:dev

# Build
npm run build

# Start production build
npm run start

# Prisma commands
npm run prisma:generate        # Regenerate Prisma client
npx prisma migrate dev         # Create and apply new migration
npx prisma migrate deploy      # Apply pending migrations (prod)
npx prisma studio              # Open Prisma Studio (DB browser)

# Lint
npm run lint
```

### Frontend

```bash
cd frontend-nestjs-prisma

# Dev mode (with Turbopack on port 3001)
npx next dev --turbopack --port 3001

# Build
npm run build

# Start production build
npm run start

# Type check
npm run type-check

# Tests
npm run test:unit
npm run test:e2e
```

### ML Service

```bash
cd ml-recommendation-service

# Docker
docker compose up -d
docker compose down

# Local
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Test all APIs
python test_all_apis.py
```

---

## Troubleshooting

### Backend won't start: "Cannot connect to database"
- Make sure Docker infrastructure is running: `docker compose -f docker-compose.dev.yml ps`
- Verify `DATABASE_URL` in `.env` points to `localhost:5432` (dev) or `postgres:5432` (Docker)
- Check PostgreSQL logs: `docker compose -f docker-compose.dev.yml logs postgres`

### Backend won't start: "Cannot connect to Redis"
- Verify Redis is healthy: `docker compose -f docker-compose.dev.yml ps`
- Check `REDIS_HOST` is `localhost` (dev) or `redis` (Docker)

### Frontend: API calls fail (CORS / 404)
- Ensure backend is running on port `4000`
- Verify `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` in `.env.local`
- Check `CORS_ORIGINS` in backend `.env` includes `http://localhost:3001`

### MinIO: File uploads fail
- Check MinIO is running and bucket `ecommerce` exists: **http://localhost:9001**
- Login with `minioadmin` / `minioadmin`
- Manually create bucket `ecommerce` if missing and set it to public

### Prisma: Migration error "uuid_generate_v4 does not exist"
- The `init-db.sql` must run on first DB creation. Run manually:
  ```bash
  docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d ecommerce -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
  ```

### ML Service: Wrong database
- The ML service defaults to `ecommerce_springboot` DB. Make sure `DATABASE_URL` is set to `postgresql://postgres:postgres@localhost:5432/ecommerce` (note: **no** `_springboot` suffix).

### Port conflicts
If ports are already in use, stop conflicting services or change the ports in the compose files and `.env`:
- PostgreSQL: change `5432` 
- Redis: change `6379`
- Backend: change `PORT` in `.env` and `ports` in compose
- Frontend: change `--port 3001`

---

## Key API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| GET | `/api/v1/auth/verify-email/:token` | Verify email |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh tokens |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/forgot-password` | Forgot password |
| POST | `/api/v1/auth/reset-password` | Reset password |
| GET | `/api/v1/auth/oauth2/google` | Google OAuth |
| GET | `/api/v1/auth/oauth2/github` | GitHub OAuth |

### ML Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/recommendations/trending` | Trending products |
| GET | `/api/v1/recommendations/user/{userId}` | Personalized recs |
| GET | `/api/v1/recommendations/product/{id}/similar` | Similar products |
| POST | `/api/v1/training/train` | Trigger model training |
| GET | `/api/v1/training/status` | Training status |

Full API reference: **http://localhost:4000/api/docs**
