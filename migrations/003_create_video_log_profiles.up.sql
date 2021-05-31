CREATE TABLE video_log_profiles(
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    privacy VARCHAR(255) NOT NULL
);

CREATE UNIQUE INDEX video_log_profile_username_unique_index ON video_log_profiles(username);
