# Life Admin OS

Life Admin OS is a personal productivity dashboard for tracking bills, subscriptions, document renewals, reminders, and recurring responsibilities in one place.

The application currently supports authentication, manual bill and subscription tracking, document expiry tracking, a polished dashboard overview, in-app reminders, background jobs, and Gmail-detected suggestions. Users can register, log in, manage recurring payments, track document expirations, receive reminder notifications, connect Gmail, and review detected bills or subscriptions before confirming them.

## Current Phase

Phase 7: Gmail Integration

- React frontend with protected routing.
- Express backend with auth APIs.
- PostgreSQL `users` table.
- Password hashing with bcrypt.
- JWT authentication.
- Basic user profile on the dashboard.
- User-scoped bill CRUD.
- User-scoped subscription CRUD.
- User-scoped document CRUD.
- Expiry status tracking for valid, expiring soon, and expired documents.
- Dedicated pages for `/dashboard`, `/bills`, `/subscriptions`, `/documents`, and `/settings`.
- Dashboard summaries for total subscriptions, monthly subscription spend, upcoming bills, and expiring documents.
- Upcoming bills, subscription renewals, expiring documents, notifications, search, and a simple subscription cost chart.
- Reminder preferences for bills, subscriptions, and documents.
- Database-backed notifications with unread, read, and dismissed states.
- Redis/BullMQ background queue for reminder checks, email scans, and notification jobs.
- Gmail OAuth connection flow.
- Gmail scan jobs that create pending detected-item suggestions.
- User confirmation workflow for detected bills and subscriptions.

## Run Locally

1. Install dependencies:

```bash
npm install --prefix backend
npm install --prefix frontend
```

2. Create the database:

```bash
createdb life_admin_os
psql life_admin_os < database/schema.sql
```

Or, if Docker is available:

```bash
docker compose up -d postgres redis
```

3. Create `.env` from `.env.example` and set `DATABASE_URL`, `JWT_SECRET`, and `REDIS_URL`. Gmail scanning also requires Google OAuth values.

4. Start the backend:

```bash
npm run dev:backend
```

5. Start the frontend:

```bash
npm run dev:frontend
```

6. Start the background worker:

```bash
npm run worker
```

Then visit:

```text
http://localhost:5173
```

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/user/profile`
- `POST /api/bills`
- `GET /api/bills`
- `GET /api/bills/:id`
- `PUT /api/bills/:id`
- `DELETE /api/bills/:id`
- `POST /api/subscriptions`
- `GET /api/subscriptions`
- `GET /api/subscriptions/:id`
- `PUT /api/subscriptions/:id`
- `DELETE /api/subscriptions/:id`
- `POST /api/documents`
- `GET /api/documents`
- `GET /api/documents/:id`
- `PUT /api/documents/:id`
- `DELETE /api/documents/:id`
- `GET /api/notifications`
- `PUT /api/notifications/:id/status`
- `POST /api/jobs/check-upcoming-reminders`
- `POST /api/jobs/scan-user-email`
- `GET /api/gmail/status`
- `GET /api/gmail/auth-url`
- `GET /api/gmail/callback`
- `POST /api/gmail/scan`
- `GET /api/detected-items`
- `POST /api/detected-items/:id/confirm`
- `POST /api/detected-items/:id/ignore`

## Project Docs

- [Project context](docs/PROJECT_CONTEXT.md)
- [Phase plan](docs/PHASE_PLAN.md)
