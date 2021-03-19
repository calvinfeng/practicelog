package store

import (
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/jmoiron/sqlx"
)

func New(db *sqlx.DB) videolog.Store {
	return &store{db: db}
}

type store struct {
	db *sqlx.DB
}
