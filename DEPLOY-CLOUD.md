# Deploy to Koyeb (Backend) + Vercel (Frontend)

## Architecture

```
┌──────────────────────────┐       ┌───────────────────────────────┐
│  Vercel                   │       │  Koyeb                         │
│  ─────────────────────   │       │  ─────────────────────────    │
│  Frontend (Next.js) :443 │──────▶│  Backend (NestJS)  :4000      │
└──────────────────────────┘       │  MinIO (S3-compat) :9000      │
         │                         └──────────────┬────────────────┘
         │                                        │
         │         ┌──────────────────────────────┴──────────────────────────┐
         │         │                                                           │
         │ ┌───────▼──────────┐                                    ┌─────────▼────────┐
         │ │  Neon.tech        │                                    │  Upstash          │
         │ │  PostgreSQL (free)│                                    │  Redis     (free) │
         │ └──────────────────┘                                    └─────────┬────────┘
         │                                                                   │
         │         ┌─────────────────────────────────────────────────────────┘
         └────────▶│  Render.com                                              │
                   │  ML Service (FastAPI) :8000                              │
                   └──────────────────────────────────────────────────────────┘
```

### Service mapping

| Service | Platform | Free tier |
|---------|----------|-----------|
| Frontend (Next.js) | Vercel | ✅ Yes |
| Backend (NestJS) | Koyeb | ✅ Yes (1 service) |
| PostgreSQL | Neon.tech | ✅ Yes (0.5 GB) |
| Redis | Upstash | ✅ Yes (10k req/day) |
| Object Storage (MinIO) | Koyeb (Docker) | ✅ Persistent volume |
| Email | Resend / SendGrid | ✅ Free tier |
| ML Service (FastAPI) | Render.com | ✅ Yes (750 hrs/month) |

---

## Step 0 — Accounts to create

1. [neon.tech](https://neon.tech) — managed serverless PostgreSQL (free)
2. [upstash.com](https://upstash.com) — serverless Redis (free)
3. [koyeb.com](https://www.koyeb.com) — cloud platform for backend + MinIO
4. [vercel.com](https://vercel.com) — frontend hosting
5. [resend.com](https://resend.com) — transactional email (free 3,000/month) **OR** [sendgrid.com](https://sendgrid.com) (free 100/day)
6. [render.com](https://render.com) — ML service hosting (free 750 hrs/month)
7. Push your code to a **GitHub repository** (required by Koyeb, Vercel & Render)

---

## Step 1 — Database: Neon.tech PostgreSQL

### Create the database

1. Go to [console.neon.tech](https://console.neon.tech) → **New Project**
2. Name: `ecommerce`, Region: closest to you
3. Click **Create Project**
4. From the dashboard → **Connection Details** → select driver **Node.js**
5. Copy the connection string — looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/ecommerce?sslmode=require
   ```
6. Save it — this is your `DATABASE_URL`

### Enable uuid-ossp extension

In Neon console → **SQL Editor**, run:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Step 2 — Redis: Upstash

1. Go to [console.upstash.com](https://console.upstash.com) → **Create Database**
2. Name: `ecommerce-redis`, Region: same region as Koyeb
3. Type: **Regional** (not Global)
4. Click **Create**
5. From the database page → **Details** tab, copy:
   - **Endpoint** → e.g. `charming-ray-12345.upstash.io`
   - **Port** → e.g. `6379`
   - **Password** → the long random string

---

## Step 3 — Email: Resend

1. Go to [resend.com](https://resend.com) → Sign up → **Add Domain** (or use the sandbox `@resend.dev` domain for testing)
2. **API Keys** → **Create API Key** → copy it
3. SMTP settings for NestJS Nodemailer:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: `<your API key>`

> **Alternative: SendGrid**
> Host: `smtp.sendgrid.net` | Port: `587` | Username: `apikey` | Password: `<your SendGrid API key>`

---

## Step 4 — Deploy Backend to Koyeb

### 4a. Push code to GitHub

Make sure the project is pushed to a GitHub repository:
```bash
git add .
git commit -m "add Dockerfile"
git push origin main
```

### 4b. Create the backend service on Koyeb

1. Go to [app.koyeb.com](https://app.koyeb.com) → **Create Service** → **Web Service**
2. **Deployment method**: GitHub
3. **Repository**: select your repo
4. **Branch**: `main`
5. **Root directory (Build context)**: `backend-nestjs-prisma`
6. **Builder**: Docker (auto-detected from `Dockerfile`)
7. **Port**: `4000`
8. **Instance type**: Nano (free tier — 512 MB RAM, 0.1 vCPU)
9. **Region**: Frankfurt or Washington DC (lowest latency for free)

### 4c. Set environment variables on Koyeb

In the service → **Environment variables**, add all the following:

```env
NODE_ENV=production
PORT=4000

# ── Database (from Neon.tech) ──
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/ecommerce?sslmode=require
DB_HOST=ep-xxx.neon.tech
DB_PORT=5432
DB_USERNAME=your_neon_user
DB_PASSWORD=your_neon_password
DB_NAME=ecommerce
DB_SYNCHRONIZE=false
DB_LOGGING=false
DB_SSL=true

# ── JWT ──
JWT_SECRET=GENERATE_A_RANDOM_64_CHAR_STRING_HERE
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION_DAYS=7

# ── CORS (set after Vercel deploy gives you the URL) ──
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app

# ── Redis (from Upstash) ──
REDIS_HOST=charming-ray-12345.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your_upstash_password
REDIS_TTL=3600

# ── Email (Resend) ──
MAIL_HOST=smtp.resend.com
MAIL_PORT=465
MAIL_USERNAME=resend
MAIL_PASSWORD=re_xxxxxxxxxxxxxxxxxxxx
MAIL_FROM=noreply@yourdomain.com

# ── MinIO (will update after Step 5) ──
MINIO_ENDPOINT=your-minio.koyeb.app
MINIO_PORT=443
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=CHANGE_THIS_STRONG_SECRET
MINIO_BUCKET_NAME=ecommerce
MINIO_USE_SSL=true
MINIO_PUBLIC_URL=https://your-minio.koyeb.app

# ── OAuth2 (optional) ──
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://your-backend.koyeb.app/api/v1/auth/oauth2/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=https://your-backend.koyeb.app/api/v1/auth/oauth2/github/callback

# ── Stripe (optional) ──
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Other ──
RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_MAX=60
MFA_ISSUER=Ecommerce
```

> **Tip:** Generate a secure JWT secret:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4d. Run database migration after first deploy

After the backend service is running, open the Koyeb service → **Console** tab:
```bash
npx prisma migrate deploy
```

Or use the Koyeb CLI:
```bash
koyeb service exec <service-name> -- npx prisma migrate deploy
```

The seed data runs automatically on first backend startup.

### 4e. Verify backend

Open your Koyeb app URL: `https://your-app.koyeb.app/api/docs`  
You should see the Swagger UI.

---

## Step 5 — MinIO on Koyeb (Object Storage)

MinIO runs as a separate Docker service on Koyeb using a persistent volume.

### 5a. Create MinIO service

1. Koyeb → **Create Service** → **Web Service**
2. **Deployment method**: Docker image
3. **Image**: `minio/minio:latest`
4. **Port**: `9000`
5. **Start command**: `server /data --console-address :9001`
6. **Instance type**: Nano (free)
7. **Persistent volume**: Mount `/data` → 1 GB

### 5b. Set MinIO environment variables

```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_THIS_STRONG_SECRET_MIN_8_CHARS
```

### 5c. Create the bucket

After MinIO starts:
1. Open `https://your-minio.koyeb.app` (console on port 9001 — add a second port if needed)
2. Login with `minioadmin` / your password
3. Create bucket named `ecommerce`, set access to **Public**

### 5d. Update backend MINIO env vars

Go back to the backend service → update:
```env
MINIO_ENDPOINT=your-minio.koyeb.app
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_PUBLIC_URL=https://your-minio.koyeb.app
MINIO_SECRET_KEY=CHANGE_THIS_STRONG_SECRET_MIN_8_CHARS
```

> **Alternative: Cloudflare R2** (S3-compatible, 10 GB free)  
> If you prefer not to run MinIO yourself, use Cloudflare R2 and update the MinIO SDK endpoint to your R2 bucket URL.

---

## Step 6 — Deploy Frontend to Vercel

### 6a. Import project

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → select your repo
3. **Framework Preset**: Next.js (auto-detected)
4. **Root Directory**: `frontend-nestjs-prisma` ← **important, change this**
5. Click **Deploy** (it will fail without env vars, fix in next step)

### 6b. Set environment variables

Go to the project → **Settings** → **Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://your-backend.koyeb.app/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Replace `your-backend.koyeb.app` with your actual Koyeb backend URL.

### 6c. Redeploy

After setting env vars: **Deployments** → **Redeploy** (last deployment).

### 6d. Update CORS on backend

Go to Koyeb backend → update these env vars with your actual Vercel URL:
```env
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app
```

Koyeb will auto-redeploy.

---

## Step 7 — Custom Domain (optional)

### Vercel custom domain
1. Vercel project → **Settings** → **Domains** → Add domain
2. Follow the DNS instructions (add CNAME/A record at your registrar)

### Koyeb custom domain
1. Koyeb service → **Domains** → **Add Domain**
2. Follow the CNAME instructions

### Update OAuth2 callback URLs
If using Google/GitHub OAuth, update the callback URLs in the provider dashboards:
```
https://yourdomain.com/api/v1/auth/oauth2/google/callback
https://yourdomain.com/api/v1/auth/oauth2/github/callback
```
And update the env vars on Koyeb.

---

## Step 8 — Update `next.config.js` for production image domains

---

## Step 9 — Deploy ML Recommendation Service to Render.com

Render is the easiest platform for Python Docker services with a free tier (750 hrs/month — enough for 1 service running 24/7).

### 9a. Create a Render account and connect GitHub

1. Go to [render.com](https://render.com) → **Sign up with GitHub**
2. Authorize Render to access your repository

### 9b. Create a new Web Service

1. Render Dashboard → **New** → **Web Service**
2. **Connect repository**: select your repo
3. **Name**: `ml-recommendation-service`
4. **Root Directory**: `ml-recommendation-service`
5. **Environment**: Docker
6. **Region**: same as Koyeb (e.g. Frankfurt)
7. **Instance Type**: Free
8. Click **Create Web Service**

### 9c. Set environment variables on Render

In the service → **Environment** tab → **Add Environment Variable**:

```env
# Database — reuse Neon (same DB as backend)
DATABASE_URL=postgresql://neondb_owner:npg_S3KygPFim2WU@ep-divine-frost-amw31hp9-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Redis — Upstash (use rediss:// with TLS for Python redis lib)
REDIS_URL=rediss://:gQAAAAAAAUCxAAIncDI2YjE0MzA5ZGNiN2U0MDcxODAzZTAzNWUwODI0YmZkZHAyODIwOTc@loved-bird-82097.upstash.io:6380/0

# ML model storage directory
ML_MODEL_DIR=/app/models

# Logging
LOG_LEVEL=INFO

# CORS — allow frontend and backend
CORS_ORIGINS=https://your-app.vercel.app,https://your-backend.koyeb.app
```

> **Upstash Redis URL format for Python:**  
> `rediss://:<password>@<endpoint>:<port>/0`  
> Note `rediss://` (double s = TLS), and `:` before the password (no username).

### 9d. Verify ML service

After deploy (takes ~3–5 min for first build), open:
```
https://ml-recommendation-service.onrender.com/health
https://ml-recommendation-service.onrender.com/docs
```

### 9e. Trigger initial model training

After the ML service is up and the backend has seeded the database:
```bash
curl -X POST https://ml-recommendation-service.onrender.com/api/v1/training/train
```

Or open the Swagger UI at `/docs` and call `POST /api/v1/training/train`.

### 9f. Connect frontend to ML service (optional)

Add to Vercel environment variables:
```env
NEXT_PUBLIC_ML_SERVICE_URL=https://ml-recommendation-service.onrender.com
```

> **Free tier note:** Render free services **sleep after 15 minutes of inactivity** and take ~30 seconds to wake up on the next request. This is fine for recommendations (non-critical). If you need it always-on, upgrade to Render Starter ($7/month) or use a cron ping service like [cron-job.org](https://cron-job.org) to ping `/health` every 10 minutes.

### 9g. Persistent model storage on Render

By default, Render's free tier has ephemeral storage — trained models are lost on redeploy. To persist models:

1. Render → service → **Disks** → **Add Disk**
2. **Mount Path**: `/app/models`
3. **Size**: 1 GB

> **Note:** Persistent disks are not available on the free tier. On free tier, models retrain automatically on startup (or trigger manually after each deploy).

If your MinIO endpoint is not `localhost`, add it to the allowed image hosts in `frontend-nestjs-prisma/next.config.js`:

```js
const nextConfig = {
  images: {
    remotePatterns: [
      // ... existing patterns ...
      {
        protocol: 'https',
        hostname: 'your-minio.koyeb.app',  // ← add this
      },
    ],
  },
};
```

Then push the change — Vercel will auto-redeploy.

---

## Checklist

- [ ] Neon.tech database created & `uuid-ossp` extension enabled
- [ ] `DATABASE_URL` noted from Neon connection string
- [ ] Upstash Redis created, endpoint + password noted
- [ ] Resend (or SendGrid) API key created
- [ ] Code pushed to GitHub
- [ ] `backend-nestjs-prisma/Dockerfile` committed
- [ ] Koyeb backend service created (Docker, port 4000)
- [ ] All backend env vars set on Koyeb
- [ ] `npx prisma migrate deploy` run in Koyeb console
- [ ] Swagger accessible at `https://your-backend.koyeb.app/api/docs`
- [ ] Koyeb MinIO service created with persistent volume
- [ ] MinIO `ecommerce` bucket created and set to public
- [ ] Backend MinIO env vars updated
- [ ] Vercel frontend project created, root dir = `frontend-nestjs-prisma`
- [ ] `NEXT_PUBLIC_API_URL` set to Koyeb backend URL
- [ ] Backend `CORS_ORIGINS` updated with Vercel URL
- [ ] Frontend loads products and can log in
- [ ] Render.com account created
- [ ] ML service deployed on Render (root dir = `ml-recommendation-service`)
- [ ] `DATABASE_URL` and `REDIS_URL` (rediss://) set on Render
- [ ] ML service `/health` returns 200
- [ ] Model training triggered via `POST /api/v1/training/train`

---

## Troubleshooting

### Build fails: "Cannot find module '@common/...'"
The `tsc-alias` step in the Dockerfile resolves this. If it still fails:
```bash
# In Koyeb build logs, check if tsc-alias ran:
# "tsc-alias -p tsconfig.json" should appear after "npm run build"
```
If not, add `tsc-alias` to dependencies:
```bash
cd backend-nestjs-prisma
npm install tsc-alias
git add package.json package-lock.json
git commit -m "add tsc-alias"
git push
```

### Prisma: "Can't reach database server"
- Check `DATABASE_URL` has `?sslmode=require` for Neon
- Ensure `DB_SSL=true` env var is set
- Test the connection string in Neon's SQL editor

### Redis: "connect ETIMEDOUT"
- Upstash Redis requires TLS. Use `REDIS_HOST` (not a `redis://` URL) + `REDIS_PASSWORD`
- Alternatively, set `REDIS_TLS=true` if the app supports it

### CORS errors on frontend
- `CORS_ORIGINS` must exactly match the Vercel URL (no trailing slash)
- Example: `CORS_ORIGINS=https://my-app.vercel.app`

### Vercel build error: "next: command not found"
- Make sure **Root Directory** in Vercel is set to `frontend-nestjs-prisma`

### Image uploads broken in production
- Check MinIO bucket is public
- Check `MINIO_ENDPOINT`, `MINIO_PORT=443`, `MINIO_USE_SSL=true`
- Check `MINIO_PUBLIC_URL` points to the public MinIO URL

### ML service: "module not found" or training fails
- Make sure `DATABASE_URL` points to Neon (not `ecommerce_springboot` — the default is wrong)
- Check `REDIS_URL` uses `rediss://` (with TLS) not `redis://`
- Check Render build logs for Python dependency install errors

### ML service: models disappear after redeploy
- Add a persistent disk at `/app/models` (requires paid Render plan)
- On free tier: trigger `POST /api/v1/training/train` after each deploy

### Free tier limits
| Platform | Limit | What happens when exceeded |
|----------|-------|---------------------------|
| Koyeb | 512 MB RAM, 1 service | App sleeps after inactivity |
| Neon | 0.5 GB storage, 1 project | Queries fail |
| Upstash Redis | 10,000 req/day | Rate limited |
| Vercel | 100 GB bandwidth/month | Overage charges |
| Resend | 3,000 emails/month | Blocked |
| Render | 750 hrs/month, sleeps after 15 min idle | Cold start ~30s |
