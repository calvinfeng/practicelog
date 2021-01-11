package logserver

import (
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/go-playground/validator/v10"
)

func New(store practicelog.Store, auth bool) practicelog.HTTPServer {
	return &server{
		store:    store,
		validate: validator.New(),
		auth:     auth,
	}
}

const defaultUsername = "calvin.j.feng@gmail.com"

type server struct {
	store    practicelog.Store
	validate *validator.Validate
	auth     bool
}
