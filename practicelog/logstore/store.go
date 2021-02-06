package logstore

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

func (s *store) SumAllLogEntryDuration() (sum int32, err error) {
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
*/
func (s *store) SumLogEntryDuration(filters ...practicelog.SQLFilter) (sum int32, err error) {
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
