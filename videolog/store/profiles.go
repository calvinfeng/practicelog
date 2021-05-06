package store

import (
	"encoding/base64"
	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/google/uuid"
)

const TimelineProfileTable = "timeline_profiles"

type DBTimelineProfile struct {
	ID       string `db:"id"`
	Username string `db:"username"`
	Privacy  string `db:"privacy"`
}

func (row *DBTimelineProfile) toModel() *videolog.TimelineProfile {
	return &videolog.TimelineProfile{
		ID:       row.ID,
		Username: row.Username,
		Privacy:  row.Privacy,
	}
}

func (row *DBTimelineProfile) fromModel(profile *videolog.TimelineProfile) *DBTimelineProfile {
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

func (s *store) GetTimelineProfileByID(id string) (*videolog.TimelineProfile, error) {
	query := squirrel.Select("*").From(TimelineProfileTable).
		Where(squirrel.Eq{"id": id})

	statement, args, err := query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return nil, err
	}

	var row DBTimelineProfile
	if err = s.db.Get(&row, statement, args...); err != nil {
		return nil, err
	}

	return row.toModel(), nil
}

func (s *store) UpsertTimelineProfile(profile *videolog.TimelineProfile) error {
	insertQ := squirrel.Insert(TimelineProfileTable).
		Columns("id", "username", "privacy").
		Suffix("ON CONFLICT(id) DO NOTHING")

	profile.ID = generateProfileID()
	row := new(DBTimelineProfile).fromModel(profile)
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
