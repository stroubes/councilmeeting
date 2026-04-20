-- Adds formal motion workflow fields for R1: Motions & Voting
-- mover/seconder track who proposed/seconded the motion
-- motion_phase enforces PROPOSED → SECONDED → DEBATING → CALLED sequence

ALTER TABLE app_motions ADD COLUMN IF NOT EXISTS mover_user_id VARCHAR(255);
ALTER TABLE app_motions ADD COLUMN IF NOT EXISTS seconder_user_id VARCHAR(255);
ALTER TABLE app_motions ADD COLUMN IF NOT EXISTS motion_phase VARCHAR(50) NOT NULL DEFAULT 'PROPOSED';

CREATE INDEX IF NOT EXISTS idx_app_motions_phase ON app_motions(motion_phase);
CREATE INDEX IF NOT EXISTS idx_app_motions_mover ON app_motions(mover_user_id);
CREATE INDEX IF NOT EXISTS idx_app_motions_seconder ON app_motions(seconder_user_id);
