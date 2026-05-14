CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  reminder_days_before INTEGER NOT NULL DEFAULT 3 CHECK (reminder_days_before >= 0),
  category VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS bills
ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER NOT NULL DEFAULT 3 CHECK (reminder_days_before >= 0);

CREATE INDEX IF NOT EXISTS idx_bills_user_due_date ON bills (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_bills_user_status ON bills (user_id, status);

DROP TRIGGER IF EXISTS bills_set_updated_at ON bills;

CREATE TRIGGER bills_set_updated_at
BEFORE UPDATE ON bills
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  billing_cycle VARCHAR(40) NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_renewal_date DATE NOT NULL,
  reminder_days_before INTEGER NOT NULL DEFAULT 3 CHECK (reminder_days_before >= 0),
  category VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS subscriptions
ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER NOT NULL DEFAULT 3 CHECK (reminder_days_before >= 0);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_renewal ON subscriptions (user_id, next_renewal_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions (user_id, status);

DROP TRIGGER IF EXISTS subscriptions_set_updated_at ON subscriptions;

CREATE TRIGGER subscriptions_set_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  expiry_date DATE NOT NULL,
  reminder_days_before INTEGER NOT NULL DEFAULT 30 CHECK (reminder_days_before >= 0),
  status VARCHAR(40) NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'expiring_soon', 'expired')),
  notes TEXT,
  file_url TEXT,
  file_type VARCHAR(120),
  file_size INTEGER CHECK (file_size IS NULL OR file_size >= 0),
  storage_key TEXT,
  uploaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS documents
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_type VARCHAR(120),
ADD COLUMN IF NOT EXISTS file_size INTEGER CHECK (file_size IS NULL OR file_size >= 0),
ADD COLUMN IF NOT EXISTS storage_key TEXT,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_documents_user_expiry ON documents (user_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_documents_user_status ON documents (user_id, status);

DROP TRIGGER IF EXISTS documents_set_updated_at ON documents;

CREATE TRIGGER documents_set_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(40) NOT NULL CHECK (type IN ('bill', 'subscription', 'document')),
  source_id UUID NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  scheduled_for DATE NOT NULL,
  due_on DATE NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_source
ON notifications (user_id, type, source_id, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications (user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_scheduled ON notifications (user_id, scheduled_for);

DROP TRIGGER IF EXISTS notifications_set_updated_at ON notifications;

CREATE TRIGGER notifications_set_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

ALTER TABLE IF EXISTS notifications
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_synced_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  delivery_method VARCHAR(40) NOT NULL DEFAULT 'in_app' CHECK (delivery_method IN ('in_app', 'email', 'calendar', 'all')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS notification_preferences_set_updated_at ON notification_preferences;

CREATE TRIGGER notification_preferences_set_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS gmail_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  google_email VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  scope TEXT,
  token_expiry TIMESTAMPTZ,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS gmail_connections_set_updated_at ON gmail_connections;

CREATE TRIGGER gmail_connections_set_updated_at
BEFORE UPDATE ON gmail_connections
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS detected_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source VARCHAR(40) NOT NULL DEFAULT 'gmail',
  source_email_id VARCHAR(255),
  type VARCHAR(40) NOT NULL CHECK (type IN ('bill', 'subscription')),
  name VARCHAR(180) NOT NULL,
  amount NUMERIC(10, 2),
  detected_date DATE NOT NULL DEFAULT CURRENT_DATE,
  suggested_due_date DATE,
  billing_cycle VARCHAR(40),
  confidence_score NUMERIC(4, 2) NOT NULL DEFAULT 0.50 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status VARCHAR(40) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ignored')),
  raw_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_detected_items_unique_email
ON detected_items (user_id, source, source_email_id, type);

CREATE INDEX IF NOT EXISTS idx_detected_items_user_status ON detected_items (user_id, status);

DROP TRIGGER IF EXISTS detected_items_set_updated_at ON detected_items;

CREATE TRIGGER detected_items_set_updated_at
BEFORE UPDATE ON detected_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
