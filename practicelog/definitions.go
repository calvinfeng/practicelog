package practicelog

import (
	"fmt"
	"time"

	"github.com/Masterminds/squirrel"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type Entry struct {
	ID          uuid.UUID     `json:"id"`
	Username    string        `json:"username" validate:"required,email"`
	Date        time.Time     `json:"date" validate:"required"`
	Duration    int32         `json:"duration" validate:"required"`
	Labels      []*Label      `json:"labels,omitempty" validate:"required,min=1"`
	Message     string        `json:"message" validate:"required"`
	Details     string        `json:"details"`
	Assignments []*Assignment `json:"assignments,omitempty"`
	TrelloID    *string       `json:"-"`
}

type Assignment struct {
	Position  int    `json:"position"`
	Name      string `json:"name"`
	Completed bool   `json:"completed"`
}

type Label struct {
	ID       uuid.UUID   `json:"id"`
	Username string      `json:"username" validate:"required,email"`
	ParentID uuid.UUID   `json:"parent_id,omitempty"`
	Name     string      `json:"name" validate:"required"`
	Children []uuid.UUID `json:"children,omitempty"`
}

func (l Label) String() string {
	return fmt.Sprintf("%s %s", l.ID, l.Name)
}

type (
	HTTPServer interface {
		ListPracticeLogLabels(echo.Context) error
		CreatePracticeLogLabel(echo.Context) error
		UpdatePracticeLogLabel(echo.Context) error
		DeletePracticeLogLabel(echo.Context) error

		ListPracticeLogEntries(echo.Context) error
		CreatePracticeLogEntry(echo.Context) error
		UpdatePracticeLogEntry(echo.Context) error
		UpdatePracticeLogAssignments(echo.Context) error
		DeletePracticeLogEntry(echo.Context) error
	}

	SQLFilter func(squirrel.Eq)

	Store interface {
		CountLogEntries(...SQLFilter) (int, error)
		SelectLogEntries(limit, offset uint64, filters ...SQLFilter) ([]*Entry, error)
		BatchInsertLogEntries(...*Entry) (int64, error)
		UpdateLogEntry(*Entry) error
		UpdateLogAssignments(*Entry) error
		DeleteLogEntry(*Entry) error

		SelectLogLabels() ([]*Label, error)
		BatchInsertLogLabels(...*Label) (int64, error)
		UpdateLogLabel(*Label) error
		DeleteLogLabel(*Label) error
	}
)
