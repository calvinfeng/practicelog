CREATE TABLE log_entries (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    date timestamp NOT NULL,
    duration INTEGER NOT NULL,
    message TEXT,
    details TEXT,
    assignments bytea,
    trello_id VARCHAR(255)
);

CREATE INDEX log_entry_trello_id_index ON log_entries(trello_id);

CREATE TABLE log_labels (
    id UUID PRIMARY KEY,
    parent_id UUID REFERENCES log_labels(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    CONSTRAINT label_name_should_be_unique UNIQUE(name)
);

CREATE TABLE association_log_entries_labels(
    association_id UUID PRIMARY KEY,
    entry_id UUID REFERENCES log_entries(id) ON DELETE CASCADE,
    label_id UUID REFERENCES log_labels(id) ON DELETE CASCADE
);

CREATE INDEX association_log_entry_id_index ON association_log_entries_labels(entry_id);
CREATE INDEX association_log_label_id_index ON association_log_entries_labels(label_id);