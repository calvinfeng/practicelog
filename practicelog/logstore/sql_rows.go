package logstore

import (
	"encoding/json"
	"time"

	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/google/uuid"
)

const LogEntryTable = "log_entries"
const LogLabelTable = "log_labels"
const AssociationLogEntryLabelTable = "association_log_entries_labels"

type DBLogEntry struct {
	ID          uuid.UUID       `db:"id"`
	UserID      string          `db:"user_id"`
	Date        time.Time       `db:"date"`
	Duration    int32           `db:"duration"`
	Message     string          `db:"message"`
	Details     string          `db:"details"`
	Assignments json.RawMessage `db:"assignments"`
	TrelloID    *string         `db:"trello_id"`
}

func (row *DBLogEntry) fromModel(model *practicelog.Entry) *DBLogEntry {
	row.ID = model.ID
	row.UserID = model.UserID
	row.Date = model.Date
	row.Message = model.Message
	row.Details = model.Details
	row.Duration = model.Duration
	row.Assignments, _ = json.Marshal(model.Assignments)
	row.TrelloID = model.TrelloID
	return row
}

func (row *DBLogEntry) toModel() *practicelog.Entry {
	model := &practicelog.Entry{
		ID:          row.ID,
		UserID:      row.UserID,
		Date:        row.Date,
		Duration:    row.Duration,
		Message:     row.Message,
		Details:     row.Details,
		Labels:      nil,
		Assignments: make([]*practicelog.Assignment, 0),
		TrelloID:    row.TrelloID,
	}
	_ = json.Unmarshal(row.Assignments, &model.Assignments)
	return model
}

type DBLogLabel struct {
	ID       uuid.UUID `db:"id"`
	ParentID uuid.UUID `db:"parent_id"`
	Name     string    `db:"name"`
}

type DBReadOnlyLogLabel struct {
	ID       uuid.UUID `db:"label_id"`
	ParentID uuid.UUID `db:"parent_id"`
	EntryID  uuid.UUID `db:"entry_id"`
	Name     string    `db:"name"`
}

func (row *DBLogLabel) fromModel(model *practicelog.Label) *DBLogLabel {
	row.ID = model.ID
	row.ParentID = model.ParentID
	row.Name = model.Name
	return row
}

func (row *DBLogLabel) toModel() *practicelog.Label {
	model := &practicelog.Label{
		ID:       row.ID,
		ParentID: row.ParentID,
		Name:     row.Name,
		Children: nil,
	}
	return model
}

// DBAssocLogEntryLabel represents the row data structure of a LEFT JOIN using the association
// table.
type DBAssocLogEntryLabel struct {
	AssociationID uuid.UUID `db:"association_id"`
	EntryID       uuid.UUID `db:"entry_id"`
	LabelID       uuid.UUID `db:"label_id"`
	DBLogLabel
}
