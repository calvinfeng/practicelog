package store

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/calvinfeng/practicelog/youtubeapi"
	"github.com/pkg/errors"
)

const videoLogEntryTable = "video_log_entries"

// DBVideoLogEntry is DB row for video log entry.
type DBVideoLogEntry struct {
	ID                string          `db:"id"`
	Username          string          `db:"username"`
	Published         time.Time       `db:"published"`
	VideoOrientation  string          `db:"video_orientation"`
	Title             string          `db:"title"`
	Description       string          `db:"description"`
	IsMonthlyProgress bool            `db:"is_monthly_progress"`
	Thumbnails        json.RawMessage `db:"thumbnails"`
	MinGuitarPractice int32           `db:"minutes_of_guitar_practice"`
}

func (row *DBVideoLogEntry) fromModel(model *videolog.Entry) *DBVideoLogEntry {
	row.ID = model.ID
	row.Published = model.Published
	row.VideoOrientation = model.VideoOrientation
	row.Title = model.Title
	row.Description = model.Description
	row.IsMonthlyProgress = model.IsMonthlyProgress
	row.Thumbnails, _ = json.Marshal(model.Thumbnails)
	row.Username = model.Username
	row.MinGuitarPractice = model.MinGuitarPractice
	return row
}

func (row *DBVideoLogEntry) toModel() *videolog.Entry {
	thumbnails := make(map[string]youtubeapi.Thumbnail)
	_ = json.Unmarshal(row.Thumbnails, &thumbnails)

	return &videolog.Entry{
		ID:                row.ID,
		Published:         row.Published,
		VideoOrientation:  row.VideoOrientation,
		Title:             row.Title,
		Description:       row.Description,
		IsMonthlyProgress: row.IsMonthlyProgress,
		Thumbnails:        thumbnails,
		Username:          row.Username,
		MinGuitarPractice: row.MinGuitarPractice,
	}
}

func (s *store) SelectVideoLogEntries(filters ...videolog.SQLFilter) ([]*videolog.Entry, error) {
	eqCondition := make(squirrel.Eq)
	for _, f := range filters {
		f(eqCondition)
	}

	query := squirrel.Select("*").
		From(videoLogEntryTable).
		Where(eqCondition).
		OrderBy("published DESC")

	statement, args, err := query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return nil, err
	}

	rows := make([]*DBVideoLogEntry, 0)
	if err = s.db.Select(&rows, statement, args...); err != nil {
		return nil, err
	}

	entries := make([]*videolog.Entry, 0)
	for _, row := range rows {
		entries = append(entries, row.toModel())
	}

	return entries, nil
}

func (s *store) BatchUpsertVideoLogEntries(entries ...*videolog.Entry) (int64, error) {
	insertQ := squirrel.Insert(videoLogEntryTable).
		Columns(
			"id",
			"published",
			"video_orientation",
			"title",
			"description",
			"is_monthly_progress",
			"thumbnails",
			"username",
			"minutes_of_guitar_practice")

	for _, entry := range entries {
		row := new(DBVideoLogEntry).fromModel(entry)
		insertQ = insertQ.Values(
			row.ID,
			row.Published,
			row.VideoOrientation,
			row.Title,
			row.Description,
			row.IsMonthlyProgress,
			row.Thumbnails,
			row.Username,
			row.MinGuitarPractice)
	}

	insertQ = insertQ.Suffix(`ON CONFLICT(id) DO UPDATE SET
		title = EXCLUDED.title,
		description = EXCLUDED.description,
		is_monthly_progress = EXCLUDED.is_monthly_progress,
		thumbnails = EXCLUDED.thumbnails,
        minutes_of_guitar_practice= EXCLUDED.minutes_of_guitar_practice`)

	statement, args, err := insertQ.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return 0, errors.Wrap(err, "failed to construct query")
	}

	tx, err := s.db.Beginx()
	if err != nil {
		return 0, errors.Wrap(err, "failed to begin transaction")
	}
	defer func() {
		if err := tx.Rollback(); err != nil && err != sql.ErrTxDone {
			panic(err)
		}
	}()

	res, err := tx.Exec(statement, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to execute query %w", err)
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit transaction %w", err)
	}

	return res.RowsAffected()
}
