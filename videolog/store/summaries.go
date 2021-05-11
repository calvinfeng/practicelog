package store

import (
	"fmt"

	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/google/uuid"
)

const progressSummaryTable = "progress_summaries"

// DBProgressSummary is a DB row for progress summary.
type DBProgressSummary struct {
	ID       uuid.UUID `db:"id"`
	Username string    `db:"username"`
	Year     int64     `db:"year"`
	Month    int64     `db:"month"`
	Title    string    `db:"title"`
	Subtitle string    `db:"subtitle"`
	Body     string    `db:"body"`
}

func (row *DBProgressSummary) fromModel(model *videolog.ProgressSummary) *DBProgressSummary {
	row.ID = model.ID
	row.Username = model.Username
	row.Year = model.Year
	row.Month = model.Month
	row.Title = model.Title
	row.Subtitle = model.Subtitle
	row.Body = model.Body
	return row
}

func (row *DBProgressSummary) toModel() *videolog.ProgressSummary {
	return &videolog.ProgressSummary{
		ID:       row.ID,
		Username: row.Username,
		Year:     row.Year,
		Month:    row.Month,
		Title:    row.Title,
		Subtitle: row.Subtitle,
		Body:     row.Body,
	}
}

func (s *store) SelectProgressSummaries(filters ...videolog.SQLFilter) ([]*videolog.ProgressSummary, error) {
	query := squirrel.Select("*").
		From(progressSummaryTable).
		OrderBy("year DESC, month DESC")

	eqCondition := squirrel.Eq{}
	for _, f := range filters {
		f(eqCondition)
	}

	statement, args, err := query.Where(eqCondition).PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to construct query %w", err)
	}

	rows := make([]*DBProgressSummary, 0)
	if err = s.db.Select(&rows, statement, args...); err != nil {
		return nil, err
	}

	summaries := make([]*videolog.ProgressSummary, 0)
	for _, row := range rows {
		summaries = append(summaries, row.toModel())
	}

	return summaries, nil
}

func (s *store) BatchUpsertProgressSummaries(summaries ...*videolog.ProgressSummary) (int64, error) {
	insertQ := squirrel.Insert(progressSummaryTable).
		Columns("id", "username", "year", "month", "title", "subtitle", "body")

	for _, summary := range summaries {
		if summary.ID == uuid.Nil {
			summary.ID = uuid.New()
		}
		row := new(DBProgressSummary).fromModel(summary)
		insertQ = insertQ.Values(
			row.ID,
			row.Username,
			row.Year,
			row.Month,
			row.Title,
			row.Subtitle,
			row.Body,
		)
	}

	insertQ = insertQ.Suffix(`
	ON CONFLICT ON CONSTRAINT unique_username_year_month
	DO UPDATE SET
		title = EXCLUDED.title,
		subtitle = EXCLUDED.subtitle,
		body = EXCLUDED.body`)

	statement, args, err := insertQ.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return 0, fmt.Errorf("failed to construct query: %w", err)
	}

	res, err := s.db.Exec(statement, args...)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}
