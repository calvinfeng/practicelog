package store

import (
	"database/sql"
	"fmt"
	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/pkg/errors"
)

func (s *store) SelectVideoLogEntries(filters ...videolog.SQLFilter) ([]*videolog.Entry, error) {
	eqCondition := make(squirrel.Eq)
	for _, f := range filters {
		f(eqCondition)
	}

	query := squirrel.Select("*").
		From(VideoLogEntryTable).
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
	entryInsertQ := squirrel.Insert(VideoLogEntryTable).
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
		entryInsertQ = entryInsertQ.Values(
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

	entryInsertQ = entryInsertQ.Suffix(`ON CONFLICT(id) DO UPDATE SET
		title = EXCLUDED.title,
		description = EXCLUDED.description,
		is_monthly_progress = EXCLUDED.is_monthly_progress,
		thumbnails = EXCLUDED.thumbnails,
        minutes_of_guitar_practice= EXCLUDED.minutes_of_guitar_practice`)

	statement, args, err := entryInsertQ.PlaceholderFormat(squirrel.Dollar).ToSql()
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
