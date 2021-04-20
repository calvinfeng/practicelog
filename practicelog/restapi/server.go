package restapi

import (
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/go-playground/validator/v10"
)

func New(store practicelog.Store) practicelog.RESTAPI {
	return &server{
		store:    store,
		validate: validator.New(),
	}
}

type server struct {
	store    practicelog.Store
	validate *validator.Validate
	auth     bool
}
