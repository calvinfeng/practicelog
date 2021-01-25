package logstore

import (
	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/google/uuid"
	"github.com/pkg/errors"
)

func (s *store) SelectLogLabels() ([]*practicelog.Label, error) {
	query := squirrel.Select("*").From(LogLabelTable)

	statement, args, err := query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return nil, err
	}

	rows := make([]*DBLogLabel, 0)
	if err = s.db.Select(&rows, statement, args...); err != nil {
		return nil, err
	}

	labels := make([]*practicelog.Label, 0)
	for _, row := range rows {
		labels = append(labels, row.toModel())
	}

	return labels, nil
}

func (s *store) BatchInsertLogLabels(labels ...*practicelog.Label) (int64, error) {
	query := squirrel.Insert(LogLabelTable).
		Columns("id", "username", "parent_id", "name")

	for _, label := range labels {
		if label.ID == uuid.Nil {
			label.ID = uuid.New()
		}
		row := new(DBLogLabel).fromModel(label)
		if row.ParentID == uuid.Nil {
			query = query.Values(row.ID, row.Username, nil, row.Name)
		} else {
			query = query.Values(row.ID, row.Username, row.ParentID, row.Name)
		}
	}

	statement, args, err := query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return 0, errors.Wrap(err, "failed to construct query")
	}

	res, err := s.db.Exec(statement, args...)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (s *store) UpdateLogLabel(label *practicelog.Label) error {
	newRow := new(DBLogLabel).fromModel(label)

	updateQ := squirrel.Update(LogLabelTable).
		Where(squirrel.Eq{"id": newRow.ID.String()}).
		Set("name", newRow.Name)
	if newRow.ParentID == uuid.Nil {
		updateQ = updateQ.Set("parent_id", nil)
	} else {
		updateQ = updateQ.Set("parent_id", newRow.ParentID.String())
	}

	statement, args, err := updateQ.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return err
	}

	res, err := s.db.Exec(statement, args...)
	if err != nil {
		return err
	}

	if count, err := res.RowsAffected(); err != nil {
		return err
	} else if count == 0 {
		return errors.New("no row was affected, query did not work as intended")
	}
	return nil
}

func (s *store) DeleteLogLabel(label *practicelog.Label) error {
	row := new(DBLogLabel).fromModel(label)
	deleteLabelQ := squirrel.Delete(LogLabelTable).Where(squirrel.Eq{"id": row.ID.String()})

	statement, args, err := deleteLabelQ.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return err
	}

	// Associations are deleted on cascade, this is an option set on Postgres.

	res, err := s.db.Exec(statement, args...)
	if err != nil {
		return err
	}

	if count, err := res.RowsAffected(); err != nil {
		return err
	} else if count == 0 {
		return errors.New("no row was affected, query did not work as intended")
	}
	return nil
}
