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

## Phase 2: Manual Bills and Subscription Tracking

Goal: Allow users to manually add and manage bills and subscriptions.

Scope:

- Bills with name, amount, due date, category, status, and notes.
- Bill create, read, update, and delete APIs.
- Subscriptions with name, amount, billing cycle, renewal date, category, status, and notes.
- Subscription create, read, update, and delete APIs.
- Subscription statuses: active, paused, and cancelled.
- User-scoped database tables for bills and subscriptions.
- Dashboard summaries for open bill total, estimated monthly subscription total, due-soon bills, and upcoming renewals.

Success criteria:

- A logged-in user can add, edit, delete, and view bills.
- A logged-in user can add, edit, delete, and view subscriptions.
- Records are scoped to the authenticated user.
- The dashboard highlights bills due in the next 14 days.
- The dashboard highlights subscription renewals in the next 30 days.

## Phase 3: Document Expiry Tracking

Goal: Help users track important documents and their expiry dates.

Scope:

- Documents with name, document type, expiry date, reminder preference, status, and notes.
- Document create, read, update, and delete APIs.
- Expiry statuses: valid, expiring soon, and expired.
- Expiring soon logic for documents within 30 days of expiry.
- User-scoped database table for documents.
- Dashboard summary for documents that need attention.

Success criteria:

- A logged-in user can add, edit, delete, and view documents.
- Records are scoped to the authenticated user.
- The dashboard clearly shows expired and expiring soon documents.
- Document status is derived from the expiry date.

## Phase 4: Dashboard and User Interface

Goal: Build a clean and useful dashboard that gives users a quick overview of important tasks.

Scope:

- Summary cards for subscriptions, monthly subscription cost, upcoming bills, and expiring documents.
- Upcoming bills section.
- Upcoming subscription renewals section.
- Expiring documents section.
- Notifications section for important alerts.
- Dedicated frontend pages for `/login`, `/register`, `/dashboard`, `/bills`, `/subscriptions`, `/documents`, and `/settings`.
- Searchable management views and a simple subscription cost chart.

Success criteria:

- A logged-in user can quickly scan upcoming responsibilities.
- Bills, subscriptions, and documents have dedicated pages.
- The dashboard is clean, minimal, professional, mobile responsive, and easy to scan.

## Phase 5: Reminder and Notification System

Goal: Notify users before important dates so the app actively helps prevent missed deadlines.

Scope:

- In-app notifications for bills, subscription renewals, and document expiries.
- Reminder preferences such as 1 day, 3 days, 7 days, or 30 days before key dates.
- Notification statuses: unread, read, and dismissed.
- Daily reminder check for bills due soon, subscriptions renewing soon, and documents expiring soon.
- Notifications database table.

Success criteria:

- The user can choose when they want to be reminded.
- The system generates useful reminders before important dates.
- The user can mark notifications as read or dismiss them.

## Phase 6: Background Processing

Goal: Handle heavy or scheduled tasks in the background so the main application stays responsive.

Scope:

- Redis-backed BullMQ job queue.
- Node.js worker service.
- Daily `check-upcoming-reminders` job.
- On-demand `scan-user-email` job.
- `send-notification` job placeholder for future email delivery.
- API endpoints for queuing reminder checks and Gmail scans.

Success criteria:

- Reminder checks can run outside the web request path.
- Email scans are queued for a worker instead of blocking the API.
- The worker can be started separately from the backend server.

## Phase 7: Gmail Integration

Goal: Reduce manual entry by detecting bills, subscriptions, and renewals from Gmail.

Scope:

- Google OAuth.
- Gmail read-only integration.
- Email scanning pipeline for likely bills, subscriptions, receipts, and renewal notices.
- Basic data extraction for name, amount, detected date, suggested date, billing cycle, and source email.
- User review flow before detected items are added.
- Detected items table with pending, confirmed, and ignored statuses.

Success criteria:

- The system suggests likely life-admin items from Gmail.
- The user stays in control and approves detected items before saving them.

## Phase 8: Google Calendar Sync

Goal: Put important dates where users already check their schedule.

Scope:

- Google Calendar OAuth scopes.
- Calendar event creation and update flow.
- Calendar sync status per item.
- Conflict handling when dates change.

Success criteria:

- Bills, renewals, expirations, and reminders can be synced to Google Calendar.
- Calendar events update when tracked items change.

## Phase 9: Automation And Insights

Goal: Add higher-value personal finance and organization insights.

Scope:

- Monthly recurring spend trends.
- Subscription cancellation candidates.
- Duplicate or forgotten subscriptions.
- Document expiration risk summary.
- Automated weekly digest.

Success criteria:

- The app does more than store data; it helps users make better decisions.
