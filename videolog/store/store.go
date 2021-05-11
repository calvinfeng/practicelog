package store

import (
	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/jmoiron/sqlx"
)

// New returns a video log DB store.
func New(db *sqlx.DB) videolog.Store {
	return &store{db: db}
}

type store struct {
	db *sqlx.DB
}

// IsMonthlyProgress applies filter by boolean field of the same name.
func IsMonthlyProgress(val bool) videolog.SQLFilter {
	return func(eq squirrel.Eq) {
		eq["is_monthly_progress"] = val
	}
}

// ByUsername applies filter by username.
func ByUsername(val string) videolog.SQLFilter {
	return func(eq squirrel.Eq) {
		eq["username"] = val
	}
}
