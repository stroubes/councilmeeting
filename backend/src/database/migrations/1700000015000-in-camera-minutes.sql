-- Adds is_in_camera column to app_minutes for D3: In-Camera Minutes

ALTER TABLE app_minutes ADD COLUMN IF NOT EXISTS is_in_camera BOOLEAN NOT NULL DEFAULT FALSE;
