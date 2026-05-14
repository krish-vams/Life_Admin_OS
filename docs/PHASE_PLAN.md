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

## Phase 8: Smart Insights and Analytics

Goal: Help users understand their spending and responsibilities better.

Scope:

- Monthly subscription total.
- Subscription spending grouped by category.
- Upcoming expense summaries for the next 7, 15, and 30 days.
- Duplicate subscription alerts for categories with multiple active subscriptions.
- Renewal pattern predictions based on each subscription billing cycle.
- Dedicated analytics page.

Success criteria:

- Users can see how much they spend on subscriptions each month.
- Users can compare subscription spending by category.
- Users can estimate upcoming payments.
- Users receive simple duplicate subscription and renewal pattern insights.

## Phase 9: Google Calendar and Email Notifications

Goal: Extend reminders outside the app through email and Google Calendar.

Scope:

- Google Calendar event creation for bills, renewals, and document expiry reminders.
- SMTP-backed reminder email delivery.
- Notification delivery preferences: in-app only, email reminder, calendar event, or all reminders.
- Worker-backed delivery through the `send-notification` job.
- Delivery metadata on notifications for email and calendar sync status.

Success criteria:

- Users can choose how reminders are delivered.
- The worker can send email reminders when SMTP is configured.
- The worker can create Google Calendar events when Google is connected with Calendar permission.

## Phase 10: Document Vault and File Uploads

Goal: Allow users to upload and securely store important document files.

Scope:

- PDF, JPG, and PNG uploads for tracked documents.
- Configurable storage directory that can be replaced by cloud storage later.
- User-owned file access through protected signed download links.
- File type validation and upload size limits.
- Document metadata for file URL, file type, file size, storage key, and upload date.
- Document delete and replace workflows that clean up stored files.

Success criteria:

- A logged-in user can upload a file for a document.
- A logged-in user can replace or download their own document file.
- Users cannot download another user's file.
- The app blocks unsupported file types and oversized uploads.

## Phase 11: Security, Validation, and Reliability

Goal: Make the application safer, more stable, and closer to production quality.

Scope:

- Shared validation helpers for email addresses, UUIDs, dates, amounts, reminder settings, and text length limits.
- Backend route guards for malformed owned-record identifiers.
- Configurable API rate limiting with a default of 100 requests per 15 minutes.
- Cleaner 404 and API error responses that avoid exposing stack traces or database details.
- Structured logs for API errors, failed login attempts, blocked auth requests, Gmail connection failures, and background job failures.
- JSON request body size limit to reduce abuse risk.

Success criteria:

- Invalid user input is rejected before saving.
- Protected APIs remain authenticated and scoped to the current user.
- Repeated requests are limited with a clear 429 response.
- Operational failures are logged without leaking system details to users.

## Phase 12: Testing

Goal: Ensure the application works correctly and does not break when new features are added.

Scope:

- Backend unit tests for validation helpers and Gmail email parsing logic.
- Backend API tests for bill endpoints and analytics summaries.
- Backend integration test for reminder generation across bills, subscriptions, and documents.
- Frontend unit test for monthly subscription cost calculations.
- Root, backend, and frontend test scripts.
- Testing guide with automated commands and a manual showcase flow.

Success criteria:

- The full test suite can run with one command.
- Core backend validation and API behavior have automated coverage.
- Reminder generation behavior has integration coverage.
- Frontend business calculations have automated coverage.

## Phase 13: Deployment and Production Setup

Goal: Prepare the application to run online with public frontend and backend URLs.

Scope:

- Production Dockerfiles for backend API and frontend static app.
- Docker Compose production-style services for backend, worker, PostgreSQL, Redis, and document storage volume.
- Vercel and Netlify frontend deployment configuration.
- Render and Railway backend deployment starter configuration.
- Deployment guide covering frontend, backend, worker, database, Redis, document storage, and production environment variables.
- Deployment readiness script that runs tests and a frontend production build.
- Frontend environment example for `VITE_API_BASE_URL`.

Success criteria:

- The project has documented production environment variables.
- The frontend can be deployed to a static host with API URL configuration.
- The backend API and worker have clear production start commands.
- PostgreSQL, Redis, and document storage setup are documented for production providers.

## Phase 14: Automation And Insights

Goal: Add higher-value personal finance and organization insights.

Scope:

- Monthly recurring spend trends.
- Subscription cancellation candidates.
- Duplicate or forgotten subscriptions.
- Document expiration risk summary.
- Automated weekly digest.

Success criteria:

- The app does more than store data; it helps users make better decisions.
