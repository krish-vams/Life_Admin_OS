# Resume and Interview Notes

## Resume Bullet

Built a full-stack personal management dashboard that helps users track bills, subscriptions, document expiry dates, and reminders. Integrated Gmail-based detection, background job processing, secure document uploads, analytics, and notification workflows to automate recurring life-admin tasks.

## Short Version

Built Life Admin OS, a React/Node/PostgreSQL productivity platform for tracking bills, subscriptions, documents, reminders, and recurring expenses with Gmail detection, background jobs, notifications, tests, and deployment setup.

## Interview Talking Points

- Designed a user-scoped data model for bills, subscriptions, documents, notifications, Gmail connections, and detected items.
- Implemented JWT authentication and authorization checks across protected APIs.
- Added BullMQ background jobs for reminder generation, Gmail scanning, and notification delivery.
- Built a document vault with upload validation and signed download links.
- Integrated Gmail OAuth, Google Calendar sync, and SMTP email reminders.
- Added analytics for recurring spending, duplicate subscriptions, upcoming expenses, and renewal predictions.
- Hardened the API with validation, rate limiting, structured logs, and clean error handling.
- Added backend and frontend tests plus deployment setup for common hosting providers.

## Project Pitch

Life Admin OS solves a practical personal organization problem: important responsibilities are scattered across inboxes, calendars, bank statements, and memory. The app centralizes those responsibilities, then automates reminders and detection workflows so users can prevent missed payments, expired documents, and forgotten subscriptions.
