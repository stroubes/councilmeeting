-- Full-text search vectors for meetings, agendas, reports, and minutes

ALTER TABLE app_meetings ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE app_agendas ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE app_staff_reports ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE app_minutes ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE app_minutes ADD COLUMN IF NOT EXISTS search_document text;

CREATE INDEX IF NOT EXISTS idx_app_meetings_search_vector ON app_meetings USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_app_agendas_search_vector ON app_agendas USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_app_staff_reports_search_vector ON app_staff_reports USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_app_minutes_search_vector ON app_minutes USING GIN (search_vector);

CREATE OR REPLACE FUNCTION app_update_meetings_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION app_update_agendas_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.rejection_reason, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION app_update_reports_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.executive_summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.recommendations, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.department, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION app_update_minutes_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_document := trim(
    concat_ws(' ',
      coalesce(NEW.content_json::text, ''),
      coalesce(NEW.rich_text_summary::text, '')
    )
  );
  NEW.search_vector := to_tsvector('english', coalesce(NEW.search_document, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_app_meetings_search_vector ON app_meetings;
CREATE TRIGGER trig_app_meetings_search_vector
BEFORE INSERT OR UPDATE ON app_meetings
FOR EACH ROW
EXECUTE FUNCTION app_update_meetings_search_vector();

DROP TRIGGER IF EXISTS trig_app_agendas_search_vector ON app_agendas;
CREATE TRIGGER trig_app_agendas_search_vector
BEFORE INSERT OR UPDATE ON app_agendas
FOR EACH ROW
EXECUTE FUNCTION app_update_agendas_search_vector();

DROP TRIGGER IF EXISTS trig_app_staff_reports_search_vector ON app_staff_reports;
CREATE TRIGGER trig_app_staff_reports_search_vector
BEFORE INSERT OR UPDATE ON app_staff_reports
FOR EACH ROW
EXECUTE FUNCTION app_update_reports_search_vector();

DROP TRIGGER IF EXISTS trig_app_minutes_search_vector ON app_minutes;
CREATE TRIGGER trig_app_minutes_search_vector
BEFORE INSERT OR UPDATE ON app_minutes
FOR EACH ROW
EXECUTE FUNCTION app_update_minutes_search_vector();

UPDATE app_meetings
SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'C');

UPDATE app_agendas
SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(rejection_reason, '')), 'C');

UPDATE app_staff_reports
SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(executive_summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(recommendations, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(department, '')), 'C');

UPDATE app_minutes
SET search_document = trim(
      concat_ws(' ', coalesce(content_json::text, ''), coalesce(rich_text_summary::text, ''))
    ),
    search_vector = to_tsvector('english', coalesce(search_document, ''));
