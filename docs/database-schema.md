# Database Schema

Life Admin OS uses PostgreSQL. The schema lives in `database/schema.sql`.

## Core Tables

### `users`

Stores account identity and hashed passwords.

Key columns:

- `id`
- `name`
- `email`
- `password_hash`
- `created_at`
- `updated_at`

### `bills`

Stores recurring or one-time bill responsibilities.

Key columns:

- `id`
- `user_id`
- `name`
- `amount`
- `due_date`
- `reminder_days_before`
- `category`
- `status`
- `notes`

Statuses:

- `upcoming`
- `paid`
- `overdue`

### `subscriptions`

Stores recurring subscription payments.

Key columns:

- `id`
- `user_id`
- `name`
- `amount`
- `billing_cycle`
- `next_renewal_date`
- `reminder_days_before`
- `category`
- `status`
- `notes`

Statuses:

- `active`
- `paused`
- `cancelled`

### `documents`

Stores document metadata and file-vault metadata.

Key columns:

- `id`
- `user_id`
- `name`
- `document_type`
- `expiry_date`
- `reminder_days_before`
- `status`
- `notes`
- `file_url`
- `file_type`
- `file_size`
- `storage_key`
- `uploaded_at`

Statuses:

- `valid`
- `expiring_soon`
- `expired`

### `notifications`

Stores reminders and delivery status.

Key columns:

- `id`
- `user_id`
- `type`
- `source_id`
- `title`
- `message`
- `scheduled_for`
- `due_on`
- `status`
- `is_read`
- `email_sent_at`
- `calendar_event_id`
- `calendar_synced_at`

Statuses:

- `unread`
- `read`
- `dismissed`

## Integration Tables

### `notification_preferences`

Stores reminder delivery preferences.

Delivery methods:

- `in_app`
- `email`
- `calendar`
- `all`

### `gmail_connections`

Stores Gmail OAuth connection metadata and tokens for a user.

Key columns:

- `user_id`
- `google_email`
- `access_token`
- `refresh_token`
- `scope`
- `token_expiry`
- `connected_at`

### `detected_items`

Stores Gmail-detected bill or subscription suggestions before the user confirms them.

Key columns:

- `user_id`
- `source`
- `source_email_id`
- `type`
- `name`
- `amount`
- `detected_date`
- `suggested_due_date`
- `billing_cycle`
- `confidence_score`
- `status`
- `raw_snippet`

Statuses:

- `pending`
- `confirmed`
- `ignored`

## Data Ownership

All user-owned tables include `user_id` and use `ON DELETE CASCADE` so deleting a user removes related life-admin records. API queries include both record `id` and authenticated `user_id` to prevent cross-user access.
