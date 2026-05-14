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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
