-- Brief log (decision 0018): every brief from /api/brief is stored before it is emailed, so none
-- is lost if email delivery fails. `environment` separates preview test briefs from real ones
-- (previews share this database). Retention is set by the data statement (founder, before launch).
CREATE TABLE IF NOT EXISTS briefs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('production', 'preview', 'local')),
  lang TEXT NOT NULL CHECK (lang IN ('en', 'ar')),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  engagement TEXT NOT NULL CHECK (engagement IN ('fixed', 'retained', 'unsure')),
  message TEXT NOT NULL,
  emailed_at TEXT,
  resend_id TEXT
);

CREATE INDEX IF NOT EXISTS briefs_created_at ON briefs (created_at);
