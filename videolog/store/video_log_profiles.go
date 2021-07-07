package store

import (
	"encoding/base64"

	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/google/uuid"
)

const videoLogProfileTable = "video_log_profiles"

// DBProfile is DB row for video log profile.
type DBProfile struct {
	ID       string `db:"id"`
	Username string `db:"username"`
	Privacy  string `db:"privacy"`
}

func (row *DBProfile) toModel() *videolog.Profile {
	return &videolog.Profile{
		ID:       row.ID,
		Username: row.Username,
		Privacy:  row.Privacy,
	}
}

func (row *DBProfile) fromModel(profile *videolog.Profile) *DBProfile {
	row.ID = profile.ID
	row.Username = profile.Username
	row.Privacy = profile.Privacy
	return row
}

// GenerateProfileID generates a UUID which has 16 bytes and truncates 8 bytes from it.
// Then the remaining 8 bytes are encoded into Base64 URL safe format.
func generateProfileID() string {
	myBytes, _ := uuid.New().MarshalBinary()
	return base64.RawURLEncoding.EncodeToString(myBytes[:8])
}

func (s *store) GetVideoLogProfileByID(id string) (*videolog.Profile, error) {
	query := squirrel.Select("*").From(videoLogProfileTable).Where(squirrel.Eq{"id": id})

	statement, args, err := query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return nil, err
	}

	var row DBProfile
	if err = s.db.Get(&row, statement, args...); err != nil {
		return nil, err
	}

	return row.toModel(), nil
}

func (s *store) GetVideoLogProfileByUsername(username string) (*videolog.Profile, error) {
	query := squirrel.Select("*").From(videoLogProfileTable).Where(squirrel.Eq{"username": username})

	statement, args, err := query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return nil, err
	}

	var row DBProfile
	if err = s.db.Get(&row, statement, args...); err != nil {
		return nil, err
	}

	return row.toModel(), nil
}

func (s *store) UpsertVideoLogProfile(profile *videolog.Profile) error {
	insertQ := squirrel.Insert(videoLogProfileTable).
		Columns("id", "username", "privacy").
		Suffix("ON CONFLICT(username) DO UPDATE SET privacy = EXCLUDED.privacy")

	if profile.ID == "" {
		profile.ID = generateProfileID()
	}

	row := new(DBProfile).fromModel(profile)
	insertQ = insertQ.Values(row.ID, row.Username, row.Privacy)

	statement, args, err := insertQ.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return err
	}

	if _, err := s.db.Exec(statement, args...); err != nil {
		return err
	}
	return nil
}
