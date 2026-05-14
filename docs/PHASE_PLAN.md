# Life Admin OS Phase Plan

## Phase 1: Project Foundation

Goal: Create the frontend, backend, database, and authentication foundation.

Scope:

- User registration with name, email, and password.
- Password hashing before storage.
- User login with email and password.
- JWT token generation after successful login.
- Protected dashboard route.
- Basic user profile with name, email, and account creation date.
- PostgreSQL `users` table.

Success criteria:

- A user can create an account.
- A user can log in.
- A logged-in user can access the dashboard.
- A logged-out user is redirected to login.
- The backend exposes `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/user/profile`.

## Phase 2: Core Life Admin Data

Goal: Add the first real life-admin records after authentication is stable.

Scope:

- Database schema for bills, subscriptions, documents, reminders, and notification preferences.
- API endpoints for CRUD operations on each module.
- Dashboard overview with upcoming bills, renewals, expirations, and reminders.
- Monthly recurring expense summary.
- Server-side validation.

Success criteria:

- A logged-in user can add, edit, delete, and view life-admin items.
- Records are scoped to the authenticated user.
- The dashboard highlights what is due soon.

## Phase 3: Smart Reminders

Goal: Turn tracked items into an active reminder system.

Scope:

- Reminder rules such as 1 day, 3 days, 7 days, or 30 days before due dates.
- Reminder status tracking.
- Email or in-app notifications.
- Dashboard filters for overdue, due soon, and completed items.

Success criteria:

- The user can configure reminder timing.
- The system can identify overdue and upcoming items automatically.

## Phase 4: Gmail Detection

Goal: Reduce manual entry by detecting bills, subscriptions, and renewals from Gmail.

Scope:

- Google OAuth.
- Gmail read-only integration.
- Email scanning pipeline for likely bills, subscriptions, receipts, and renewal notices.
- User review flow before detected items are added.

Success criteria:

- The system suggests likely life-admin items from Gmail.
- The user stays in control and approves detected items before saving them.

## Phase 5: Google Calendar Sync

Goal: Put important dates where users already check their schedule.

Scope:

- Google Calendar OAuth scopes.
- Calendar event creation and update flow.
- Calendar sync status per item.
- Conflict handling when dates change.

Success criteria:

- Bills, renewals, expirations, and reminders can be synced to Google Calendar.
- Calendar events update when tracked items change.

## Phase 6: Automation And Insights

Goal: Add higher-value personal finance and organization insights.

Scope:

- Monthly recurring spend trends.
- Subscription cancellation candidates.
- Duplicate or forgotten subscriptions.
- Document expiration risk summary.
- Automated weekly digest.

Success criteria:

- The app does more than store data; it helps users make better decisions.
