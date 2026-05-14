# Life Admin OS

Life Admin OS is a personal productivity dashboard for tracking bills, subscriptions, document renewals, reminders, and recurring responsibilities in one place.

The first phase is a full-stack authentication foundation. Users can register, log in, receive a JWT, and access a protected dashboard backed by PostgreSQL.

## Current Phase

Phase 1: Project Foundation

- React frontend with protected routing.
- Express backend with auth APIs.
- PostgreSQL `users` table.
- Password hashing with bcrypt.
- JWT authentication.
- Basic user profile on the dashboard.

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

## Project Docs

- [Project context](docs/PROJECT_CONTEXT.md)
- [Phase plan](docs/PHASE_PLAN.md)
