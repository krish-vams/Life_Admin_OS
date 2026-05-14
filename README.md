# Life Admin OS

Life Admin OS is a personal productivity dashboard for tracking bills, subscriptions, document renewals, reminders, and recurring responsibilities in one place.

The application currently supports authentication, manual bill and subscription tracking, and document expiry tracking. Users can register, log in, manage recurring payments, track important document expirations, and view a protected dashboard backed by PostgreSQL.

## Current Phase

Phase 3: Document Expiry Tracking

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
- Dashboard summaries for open bills, subscription spend, due bills, and upcoming renewals.
- Dashboard summary for documents needing attention.

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
docker compose up -d postgres
```

3. Create `.env` from `.env.example` and set `DATABASE_URL` and `JWT_SECRET`.

4. Start the backend:

```bash
npm run dev:backend
```

5. Start the frontend:

```bash
npm run dev:frontend
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

## Project Docs

- [Project context](docs/PROJECT_CONTEXT.md)
- [Phase plan](docs/PHASE_PLAN.md)
