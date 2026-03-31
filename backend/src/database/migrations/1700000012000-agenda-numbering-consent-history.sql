-- Bylaw-Agenda Integration: link agenda items to bylaw records
ALTER TABLE app_agenda_items ADD COLUMN IF NOT EXISTS bylaw_id UUID REFERENCES bylaws(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_app_agenda_items_bylaw_id ON app_agenda_items(bylaw_id);

-- Agenda Numbering: sequential item numbers within an agenda
ALTER TABLE app_agenda_items ADD COLUMN IF NOT EXISTS item_number VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_app_agenda_items_item_number ON app_agenda_items(item_number);

-- Consent Agenda: items with item_type='CONSENT_ITEM' are grouped as consent agenda
-- No schema change needed; item_type enum already includes 'CONSENT_ITEM'

-- Agenda Version History: snapshot table for audit trail
CREATE TABLE IF NOT EXISTS agenda_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID NOT NULL REFERENCES app_agendas(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  snapshot_json JSONB NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agenda_version_history_agenda ON agenda_version_history(agenda_id);
CREATE INDEX IF NOT EXISTS idx_agenda_version_history_version ON agenda_version_history(agenda_id, version);
