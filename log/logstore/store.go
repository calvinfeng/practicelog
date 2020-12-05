package logstore

import (
	"database/sql"
	"fmt"

	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/log"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
)

func New(db *sqlx.DB) log.Store {
	return &store{db: db}
}

type store struct {
	db *sqlx.DB
}

func (s *store) DeleteLogLabel(label *log.Label) error {
	row := new(logLabelRow).fromModel(label)
	deleteLabelQ := squirrel.Delete(logLabelTable).Where(squirrel.Eq{"id": row.ID.String()})

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

func (s *store) DeleteLogEntry(entry *log.Entry) error {
	row := new(logEntryRow).fromModel(entry)

	deleteEntryQ := squirrel.Delete(logEntryTable).Where(squirrel.Eq{"id": row.ID.String()})

	statement, args, err := deleteEntryQ.PlaceholderFormat(squirrel.Dollar).ToSql()
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

func (s *store) UpdateLogLabel(label *log.Label) error {
	newRow := new(logLabelRow).fromModel(label)

	updateQ := squirrel.Update(logLabelTable).
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

func (s *store) CountLogEntries(filters ...log.SQLFilter) (int, error) {
	eqCondition := make(squirrel.Eq)
	for _, f := range filters {
		f(eqCondition)
	}

	query := squirrel.Select("COUNT(*)").Where(eqCondition).From(logEntryTable)
	if val, hasKey := eqCondition["label_id"]; hasKey {
		if labelIDs, ok := val.([]string); ok && len(labelIDs) > 0 {
			query = squirrel.Select(fmt.Sprintf("COUNT(DISTINCT %s.id)", logEntryTable)).
				From(logEntryTable).
				LeftJoin(fmt.Sprintf("%s ON %s.id = entry_id", associationLogEntryLabelTable, logEntryTable)).
				Where(eqCondition)
		}
	}

	statement, args, err := query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return 0, errors.Wrap(err, "failed to construct query")
	}

	count := make([]int, 0)
	if err = s.db.Select(&count, statement, args...); err != nil {
		return 0, err
	}

	return count[0], nil
}

func (s *store) SelectLogEntries(limit, offset uint64, filters ...log.SQLFilter) ([]*log.Entry, error) {
	eqCondition := make(squirrel.Eq)
	for _, f := range filters {
		f(eqCondition)
	}

	query := squirrel.Select("*").
		From(logEntryTable).
		Limit(limit).
		Offset(offset).
		Where(eqCondition).
		OrderBy("date DESC")

	if val, hasKey := eqCondition["label_id"]; hasKey {
		if labelIDs, ok := val.([]string); ok && len(labelIDs) > 0 {
			query = squirrel.Select("id", "user_id", "date", "duration", "message").
				From(logEntryTable).
				LeftJoin(fmt.Sprintf("%s ON %s.id = entry_id", associationLogEntryLabelTable, logEntryTable)).
				Limit(limit).
				Offset(offset).
				Where(eqCondition).
				GroupBy(fmt.Sprintf("%s.id", logEntryTable)).
				OrderBy("date DESC")
		}
	}

	statement, args, err := query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return nil, err
	}

	rows := make([]*logEntryRow, 0)
	if err = s.db.Select(&rows, statement, args...); err != nil {
		return nil, err
	}

	entries := make([]*log.Entry, 0)
	for _, row := range rows {
		entries = append(entries, row.toModel())
	}

	entryIDs := make([]string, 0, len(entries))
	for _, entry := range entries {
		entryIDs = append(entryIDs, entry.ID.String())
	}

	// This join can become expensive eventually.
	// But I want to have data consistency for labels.
	query = squirrel.
		Select("entry_id", "label_id", "parent_id", "name").
		From(logLabelTable).
		LeftJoin(fmt.Sprintf("%s ON id = label_id", associationLogEntryLabelTable)).
		Where(squirrel.Eq{
			"entry_id": entryIDs,
		})

	statement, args, err = query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return nil, err
	}

	labelRows := make([]*logLabelRowReadOnly, 0)
	if err = s.db.Select(&labelRows, statement, args...); err != nil {
		return nil, err
	}

	entryToLabels := make(map[uuid.UUID]map[uuid.UUID]*log.Label)
	for _, lbl := range labelRows {
		if _, ok := entryToLabels[lbl.EntryID]; !ok {
			entryToLabels[lbl.EntryID] = make(map[uuid.UUID]*log.Label)
		}
		entryToLabels[lbl.EntryID][lbl.ID] = &log.Label{
			ID:       lbl.ID,
			ParentID: lbl.ParentID,
			Name:     lbl.Name,
		}
	}

	for _, entry := range entries {
		labels, ok := entryToLabels[entry.ID]
		if !ok {
			continue
		}

		entry.Labels = make([]*log.Label, 0, len(labels))
		for _, label := range labels {
			entry.Labels = append(entry.Labels, label)
		}
	}

	return entries, nil
}

func (s *store) SelectLogLabels() ([]*log.Label, error) {
	query := squirrel.Select("*").From(logLabelTable)

	statement, args, err := query.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return nil, err
	}

	rows := make([]*logLabelRow, 0)
	if err = s.db.Select(&rows, statement, args...); err != nil {
		return nil, err
	}

	labels := make([]*log.Label, 0)
	for _, row := range rows {
		labels = append(labels, row.toModel())
	}

	return labels, nil
}

func (s *store) UpdateLogEntry(entry *log.Entry) error {
	newRow := new(logEntryRow).fromModel(entry)

	updateQ := squirrel.Update(logEntryTable).
		Set("user_id", newRow.UserID).
		Set("date", newRow.Date).
		Set("duration", newRow.Duration).
		Set("message", newRow.Message).
		Set("details", newRow.Details).
		Set("assignments", newRow.Assignments).
		Where(squirrel.Eq{"id": newRow.ID.String()})

	statement, args, err := updateQ.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return err
	}

	tx, err := s.db.Beginx()
	if err != nil {
		return err
	}
	defer func() {
		if err := tx.Rollback(); err != nil && err != sql.ErrTxDone {
			panic(err)
		}
	}()

	res, err := tx.Exec(statement, args...)
	if err != nil {
		return err
	}

	// Update association by removing everything and re-insert.
	deleteQ := squirrel.Delete(associationLogEntryLabelTable).
		Where(squirrel.Eq{"entry_id": newRow.ID.String()})

	statement, args, err = deleteQ.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return err
	}

	_, err = tx.Exec(statement, args...)
	if err != nil {
		return err
	}

	// Re-insert associations
	joinQ := squirrel.Insert(associationLogEntryLabelTable).
		Columns("association_id", "entry_id", "label_id")
	for _, label := range entry.Labels {
		joinQ = joinQ.Values(uuid.New(), entry.ID, label.ID)
	}

	statement, args, err = joinQ.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return err
	}

	_, err = tx.Exec(statement, args...)
	if err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction %w", err)
	}

	if count, err := res.RowsAffected(); err != nil {
		return err
	} else if count == 0 {
		return errors.New("no row was affected, query did not work as intended")
	}
	return nil
}

func (s *store) UpdateLogAssignments(entry *log.Entry) error {
	newRow := new(logEntryRow).fromModel(entry)

	updateQ := squirrel.Update(logEntryTable).
		Set("assignments", newRow.Assignments).
		Where(squirrel.Eq{"id": newRow.ID.String()})

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

func (s *store) BatchInsertLogLabels(labels ...*log.Label) (int64, error) {
	query := squirrel.Insert(logLabelTable).
		Columns("id", "parent_id", "name")

	for _, label := range labels {
		label.ID = uuid.New()
		row := new(logLabelRow).fromModel(label)
		if row.ParentID == uuid.Nil {
			query = query.Values(row.ID, nil, row.Name)
		} else {
			query = query.Values(row.ID, row.ParentID, row.Name)
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

func (s *store) BatchInsertLogEntries(entries ...*log.Entry) (int64, error) {
	entryInsertQ := squirrel.Insert(logEntryTable).
		Columns("id", "user_id", "date", "duration", "message", "details", "assignments")

	joinInsertQ := squirrel.Insert(associationLogEntryLabelTable).
		Columns("association_id", "entry_id", "label_id")

	for _, entry := range entries {
		entry.ID = uuid.New()
		row := new(logEntryRow).fromModel(entry)
		entryInsertQ = entryInsertQ.Values(
			row.ID, row.UserID, row.Date, row.Duration, row.Message, row.Details, row.Assignments)

		for _, label := range entry.Labels {
			joinInsertQ = joinInsertQ.Values(uuid.New(), entry.ID, label.ID)
		}
	}

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

	statement, args, err = joinInsertQ.PlaceholderFormat(squirrel.Dollar).ToSql()
	if err != nil {
		return 0, errors.Wrap(err, "failed to construct query")
	}

	_, err = tx.Exec(statement, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to execute query %w", err)
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit transaction %w", err)
	}

	return res.RowsAffected()
}
