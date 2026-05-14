# API Design

The backend exposes REST-style JSON APIs under `/api`. Most routes require a JWT bearer token.

## Auth

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in and receive JWT |
| GET | `/api/user/profile` | Get current user profile |

## Bills

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/bills` | Create a bill |
| GET | `/api/bills` | List current user's bills |
| GET | `/api/bills/:id` | Get one bill |
| PUT | `/api/bills/:id` | Update one bill |
| DELETE | `/api/bills/:id` | Delete one bill |

Bill fields:

- `name`
- `amount`
- `dueDate`
- `reminderDaysBefore`
- `category`
- `status`
- `notes`

## Subscriptions

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/subscriptions` | Create a subscription |
| GET | `/api/subscriptions` | List current user's subscriptions |
| GET | `/api/subscriptions/:id` | Get one subscription |
| PUT | `/api/subscriptions/:id` | Update one subscription |
| DELETE | `/api/subscriptions/:id` | Delete one subscription |

Subscription statuses:

- `active`
- `paused`
- `cancelled`

Billing cycles:

- `weekly`
- `monthly`
- `quarterly`
- `yearly`

## Documents

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/documents` | Create document metadata |
| GET | `/api/documents` | List current user's documents |
| GET | `/api/documents/:id` | Get one document |
| PUT | `/api/documents/:id` | Update document metadata |
| POST | `/api/documents/:id/upload` | Upload or replace document file |
| GET | `/api/documents/:id/download-url` | Create signed download URL |
| GET | `/api/documents/:id/download` | Download with signed token |
| DELETE | `/api/documents/:id` | Delete document metadata and stored file |

Upload limits:

- Allowed types: PDF, JPG, PNG.
- Default max size: 10 MB.

## Notifications

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/notifications` | List notifications |
| PUT | `/api/notifications/:id/status` | Set unread, read, or dismissed |
| POST | `/api/notifications/:id/send` | Queue notification delivery |

## Notification Preferences

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/notification-preferences` | Get delivery preference |
| PUT | `/api/notification-preferences` | Set in-app, email, calendar, or all |

## Gmail and Detected Items

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/gmail/status` | Check Gmail connection |
| GET | `/api/gmail/auth-url` | Create OAuth URL |
| GET | `/api/gmail/callback` | Google OAuth callback |
| POST | `/api/gmail/scan` | Queue Gmail scan |
| GET | `/api/detected-items` | List detected suggestions |
| POST | `/api/detected-items/:id/confirm` | Confirm and save suggestion |
| POST | `/api/detected-items/:id/ignore` | Ignore suggestion |

## Jobs and Analytics

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/jobs/check-upcoming-reminders` | Queue reminder generation |
| POST | `/api/jobs/scan-user-email` | Queue Gmail scan |
| GET | `/api/analytics/summary` | Get spending and responsibility insights |

## API Safety

- All user-owned records are queried with `user_id`.
- UUID parameters are validated before database access.
- Input validation runs before save operations.
- Global rate limiting defaults to 100 requests per 15 minutes.
- Server errors return clean messages and are logged server-side.
