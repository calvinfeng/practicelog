package store

import (
	"fmt"
	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/google/uuid"
)

func (s *store) SelectProgressSummaries(filters ...videolog.SQLFilter) ([]*videolog.ProgressSummary, error) {
	query := squirrel.Select("*").
		From(ProgressSummaryTable).
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

func (s *store) BatchInsertProgressSummaries(summaries ...*videolog.ProgressSummary) (int64, error) {
	insertQ := squirrel.Insert(ProgressSummaryTable).
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
