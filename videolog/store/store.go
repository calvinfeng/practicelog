package store

import (
	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/jmoiron/sqlx"
)

func New(db *sqlx.DB) videolog.Store {
	return &store{db: db}
}

type store struct {
	db *sqlx.DB
}

func IsMonthlyProgress(val bool) videolog.SQLFilter {
	return func(eq squirrel.Eq) {
		eq["is_monthly_progress"] = val
	}
}

func ByUsername(val string) videolog.SQLFilter {
	return func(eq squirrel.Eq) {
		eq["username"] = val
	}
}
