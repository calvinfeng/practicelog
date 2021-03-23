ALTER TABLE log_entries ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE;

CREATE TABLE video_log_entries (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    published TIMESTAMP WITH TIME ZONE,
    video_orientation VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    is_monthly_progress BOOLEAN,
    thumbnails JSONB,
    minutes_of_guitar_practice INTEGER
);

CREATE TABLE progress_summaries (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    body TEXT,
    CONSTRAINT unique_year_month UNIQUE (year, month)
);