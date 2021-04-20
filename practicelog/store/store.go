package store

import (
	"fmt"
	"time"

	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/jmoiron/sqlx"
)

func New(db *sqlx.DB) practicelog.Store {
	return &store{db: db}
}

type store struct {
	db *sqlx.DB
}

func (s *store) SumLogEntryDurationBefore(now time.Time) (sum int32, err error) {
	query := squirrel.
		Select("SUM(duration)").From(LogEntryTable).
		Where(squirrel.Lt{"date": now})

	statement, args, qErr := query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if qErr != nil {
		err = qErr
		return
	}

	var intPointer *int32
	if err = s.db.Get(&intPointer, statement, args...); err != nil {
		return
	}

	if intPointer != nil {
		sum = *intPointer
	}
	return
}

func (s *store) SumLogEntryDuration() (sum int32, err error) {
	query := squirrel.Select("SUM(duration)").From(LogEntryTable)
	statement, args, qErr := query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if qErr != nil {
		err = qErr
		return
	}

	if err = s.db.Get(&sum, statement, args...); err != nil {
		return
	}
	return
}

func (s *store) ListLogLabelDurations() ([]*practicelog.LabelDuration, error) {
	query := squirrel.Select("label_id", "SUM(duration) as duration_sum").
		From(LogEntryTable).
		LeftJoin(fmt.Sprintf("%s ON %s.id = entry_id", AssociationLogEntryLabelTable, LogEntryTable)).
		LeftJoin(fmt.Sprintf("%s ON label_id = %s.id", LogLabelTable, LogLabelTable)).
		GroupBy("label_id").
		OrderBy("label_id")

	statement, args, qErr := query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if qErr != nil {
		return nil, qErr
	}

	rows := make([]*DBReadOnlyLogLabelDuration, 0)
	if err := s.db.Select(&rows, statement, args...); err != nil {
		return nil, err
	}

	models := make([]*practicelog.LabelDuration, len(rows))
	for i := range rows {
		models[i] = rows[i].toModel()
	}

	return models, nil
}
