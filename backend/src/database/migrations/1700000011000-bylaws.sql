CREATE TABLE IF NOT EXISTS bylaws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bylaw_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content_json JSONB NOT NULL DEFAULT '{}',
  adopted_at TIMESTAMPTZ,
  amended_at TIMESTAMPTZ,
  repealing_meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  status record_status_enum NOT NULL DEFAULT 'ACTIVE',
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bylaws_bylaw_number ON bylaws(bylaw_number);
CREATE INDEX IF NOT EXISTS idx_bylaws_status ON bylaws(status);
CREATE INDEX IF NOT EXISTS idx_bylaws_adopted_at ON bylaws(adopted_at);
