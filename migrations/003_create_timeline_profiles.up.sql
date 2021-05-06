CREATE TABLE timeline_profiles(
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    privacy VARCHAR(255) NOT NULL
);

CREATE UNIQUE INDEX timeline_profile_username_unique_index ON timeline_profiles(username);
