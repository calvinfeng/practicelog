# Migration History

> migrations/001_create_log_entries_and_labels.up.sql

- Create log entries table
- Create log labels table
- Create association table for many-to-many relationships
- Create indices

> migrations/002_create_video_log_entries.up.sql

- Create video log entries table
- Alter log entry date type to `TIMESTAMP WITH TIME ZONE`