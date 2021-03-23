package store

import (
	"fmt"
	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/jmoiron/sqlx"
	"github.com/sirupsen/logrus"
)

func New(db *sqlx.DB) practicelog.Store {
	return &store{db: db}
}

type store struct {
	db *sqlx.DB
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

/* Performance Consideration

This is not an effective query but at current scale it's okay.
Use the examples from ListLogLabelDurations or simply combine the two?
*/
func (s *store) SumLogEntryDurationWithFilters(filters ...practicelog.SQLFilter) (sum int32, err error) {
	eqCondition := make(squirrel.Eq)
	for _, f := range filters {
		f(eqCondition)
	}

	query := squirrel.Select("*").
		From(LogEntryTable).
		Where(eqCondition).
		OrderBy("date DESC")

	if val, hasKey := eqCondition["label_id"]; hasKey {
		if labelIDs, ok := val.([]string); ok && len(labelIDs) > 0 {
			query = squirrel.Select("id", "date", "duration", "message").
				From(LogEntryTable).
				LeftJoin(fmt.Sprintf("%s ON %s.id = entry_id", AssociationLogEntryLabelTable, LogEntryTable)).
				Where(eqCondition).
				GroupBy(fmt.Sprintf("%s.id", LogEntryTable)).
				OrderBy("date DESC")
		}
	}

	statement, args, qErr := query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if qErr != nil {
		err = qErr
		return
	}

	rows := make([]*DBReadOnlyLogEntryDuration, 0)
	if err = s.db.Select(&rows, statement, args...); err != nil {
		return
	}

	for _, row := range rows {
		logrus.Debugf("%s %s %s %s", row.ID, row.Username, row.Message, row.Duration)
		sum += row.Duration
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
