DROP TABLE IF EXISTS video_log_entries;
DROP TABLE IF EXISTS monthly_summaries;
ALTER TABLE log_entries ALTER COLUMN date TYPE TIMESTAMP;
