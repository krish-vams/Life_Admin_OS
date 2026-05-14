# Demo Script

Target length: 2 to 3 minutes.

## 1. Opening

Life Admin OS is a full-stack personal management dashboard for tracking bills, subscriptions, document expirations, reminders, and recurring responsibilities in one place.

## 2. Login

Show:

- Register or log in.
- Protected routing sends authenticated users to the dashboard.

Talking point:

The app uses JWT authentication and user-scoped database queries so each user only sees their own records.

## 3. Dashboard

Show:

- Summary cards.
- Upcoming bills.
- Subscription renewals.
- Expiring documents.
- Notifications.

Talking point:

The dashboard is designed for quick scanning. It surfaces upcoming responsibilities without making users dig through separate tools.

## 4. Add a Bill

Show:

- Go to Bills.
- Add a bill with amount, due date, category, status, reminder preference, and notes.
- Return to dashboard and show the bill appears in the relevant section.

Talking point:

The backend validates inputs and stores each bill under the authenticated user.

## 5. Add a Subscription

Show:

- Go to Subscriptions.
- Add a recurring subscription with billing cycle and next renewal date.
- Open Analytics.

Talking point:

The analytics page converts billing cycles into estimated monthly cost and groups spending by category.

## 6. Document Vault

Show:

- Add a document with expiry date.
- Upload a PDF, JPG, or PNG.
- Download through the protected link.

Talking point:

Downloads use signed URLs so files are not exposed as public static assets.

## 7. Gmail Detection Flow

Show:

- Open Settings.
- Show Gmail connection controls.
- Explain detected item review.

Talking point:

Gmail scans run as background jobs. The app suggests detected bills and subscriptions, but the user confirms or ignores them before anything is saved.

## 8. Reminder System

Show:

- Notification preferences.
- Trigger reminder check if available.
- Show notification statuses.

Talking point:

The worker checks upcoming bills, subscriptions, and document expiries, then creates notifications and can send email or calendar reminders.

## 9. Closing

This project demonstrates authentication, database modeling, CRUD APIs, background processing, file uploads, third-party integrations, notification workflows, security hardening, tests, and deployment preparation.
