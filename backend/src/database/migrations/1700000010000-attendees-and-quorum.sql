-- Migration: 1700000010000-attendees-and-quorum
-- Creates meeting_attendees table for tracking who was present at meetings.
-- Also adds council_size to meeting types for quorum calculation per BC Community Charter s.128.

BEGIN;

CREATE TYPE attendance_role AS ENUM ('CHAIR', 'COUNCIL_MEMBER', 'STAFF', 'GUEST');

CREATE TYPE attendee_status AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE', 'EARLY_DEPARTURE');

CREATE TABLE IF NOT EXISTS meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES app_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role attendance_role NOT NULL DEFAULT 'COUNCIL_MEMBER',
  status attendee_status NOT NULL DEFAULT 'PRESENT',
  arrived_at TIMESTAMPTZ,
  departed_at TIMESTAMPTZ,
  is_conflict_of_interest BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (meeting_id, user_id)
);

CREATE INDEX idx_meeting_attendees_meeting ON meeting_attendees(meeting_id);
CREATE INDEX idx_meeting_attendees_user ON meeting_attendees(user_id);
CREATE INDEX idx_meeting_attendees_status ON meeting_attendees(meeting_id, status);

ALTER TABLE app_meeting_types ADD COLUMN IF NOT EXISTS council_size INTEGER NOT NULL DEFAULT 0;
ALTER TABLE app_meeting_types ADD COLUMN IF NOT EXISTS quorum_required BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_meeting_types_council_size ON app_meeting_types(council_size);

COMMIT;