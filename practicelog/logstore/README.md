# SQL Stuff Here

To simplify testing SQL queries, use SQL Fiddle.

Build a simplified schema

```sql
CREATE TABLE log_entries (
    id INT PRIMARY KEY,
    duration INTEGER NOT NULL
);

CREATE TABLE log_labels (
    id INT PRIMARY KEY
);

CREATE TABLE association_log_entries_labels(
    association_id SERIAL PRIMARY KEY,
    entry_id INT REFERENCES log_entries(id) ON DELETE CASCADE,
    label_id INT REFERENCES log_labels(id) ON DELETE CASCADE
);

CREATE INDEX association_log_entry_id_index ON association_log_entries_labels(entry_id);
CREATE INDEX association_log_label_id_index ON association_log_entries_labels(label_id);

INSERT INTO log_entries (id, duration)
VALUES (1, 100), (2, 200), (3, 300), (4, 400), (5, 500), (6, 600);

INSERT INTO log_labels (id)
VALUES (1), (2), (3), (4), (5), (6);

INSERT INTO association_log_entries_labels (entry_id, label_id)
VALUES (1, 1), (1, 2), (2, 1), (2, 3), (3, 1), (3, 2), (4, 1), (4, 3), (5, 4), (5, 6), (6, 4), (6, 5);
```

Run simplified queries

```sql
SELECT label_id, SUM(duration) FROM log_entries 
JOIN association_log_entries_labels ON log_entries.id = entry_id 
JOIN log_labels ON label_id = log_labels.id GROUP BY label_id;

SELECT label_id, entry_id, duration FROM log_entries 
JOIN association_log_entries_labels ON log_entries.id = entry_id 
JOIN log_labels ON label_id = log_labels.id ORDER BY label_id;
```
