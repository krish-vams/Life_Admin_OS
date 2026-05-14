# Life Admin OS Deployment

Phase 13 prepares the app for production deployment across separate frontend, backend, worker, database, Redis, and file-storage services.

## Recommended Production Architecture

- Frontend: Vercel or Netlify, built from `frontend`.
- Backend API: Render, Railway, Fly.io, or AWS EC2, started with `npm --prefix backend start`.
- Worker: separate backend worker process, started with `npm --prefix backend run worker`.
- Database: Neon PostgreSQL, Supabase PostgreSQL, or AWS RDS.
- Redis: Upstash Redis, Redis Cloud, Railway Redis, or Render Redis.
- File storage: persistent disk for the current local-storage driver, or S3/Supabase/Cloudinary when a cloud storage driver is added.

## Pre-Deployment Check

Run this before deploying:

```bash
npm run deploy:check
```

This runs backend tests, frontend tests, and a production frontend build.

## Frontend Deployment

### Vercel

Use the included `vercel.json`.

Set this environment variable:

```text
VITE_API_BASE_URL=https://your-api-domain.example.com
```

### Netlify

Use the included `netlify.toml`.

Set this environment variable:

```text
VITE_API_BASE_URL=https://your-api-domain.example.com
```

## Backend Deployment

The backend must run as a web service.

Build command:

```bash
npm ci --omit=dev
```

Start command:

```bash
npm start
```

Health check path:

```text
/api/health
```

## Worker Deployment

Run the worker as a separate background service with the same backend environment variables:

```bash
npm run worker
```

The worker handles reminder checks, Gmail scans, and notification delivery. Do not rely on the API web service to run worker jobs.

## Database Setup

Create a production PostgreSQL database with Neon, Supabase, or RDS. Apply the schema:

```bash
psql "$DATABASE_URL" < database/schema.sql
```

If the database provider requires SSL, use the SSL-enabled connection string they provide.

## Redis Setup

Create Redis with Upstash, Redis Cloud, Railway, or Render. Set:

```text
REDIS_URL=rediss://...
```

Use the provider's TLS URL when available.

## Document Storage

The current document vault stores files on disk at `DOCUMENT_STORAGE_DIR`.

For production:

- Render: attach a persistent disk and set `DOCUMENT_STORAGE_DIR=/var/data/documents`.
- Railway/Fly.io/EC2: mount persistent storage and point `DOCUMENT_STORAGE_DIR` at that mount.
- Vercel/Netlify: do not run the backend file upload service there because serverless filesystems are not durable.

S3-style variables are included in `.env.example` for the next storage-driver upgrade:

```text
S3_BUCKET_NAME=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=
```

## Required Backend Environment Variables

```text
NODE_ENV=production
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
PORT=4000
CORS_ORIGIN=https://your-frontend-domain.example.com
FRONTEND_URL=https://your-frontend-domain.example.com
REDIS_URL=
DOCUMENT_STORAGE_DIR=/var/data/documents
DOCUMENT_SIGNING_SECRET=
MAX_DOCUMENT_UPLOAD_BYTES=10485760
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## Optional Integrations

Google OAuth:

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://your-api-domain.example.com/api/gmail/callback
```

Email delivery:

```text
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_DISABLE_STARTTLS=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=Life Admin OS <no-reply@your-domain.example.com>
```

## Render Blueprint

The included `render.yaml` defines:

- API web service
- Worker service
- Persistent disk mount for document uploads
- Health check path
- Required production environment variables

You still need to provide production `DATABASE_URL`, `REDIS_URL`, frontend URL, and integration secrets in Render.

## Railway

The included `railway.json` starts the backend API. Create separate Railway services for:

- API web service
- Worker process using `npm --prefix backend run worker`
- PostgreSQL
- Redis

Set the same backend environment variables on the API and worker services.

## Docker

Build and run local production-style services:

```bash
docker compose up --build
```

The compose setup starts PostgreSQL, Redis, backend API, and worker. The frontend can still run locally with:

```bash
npm run dev:frontend
```
