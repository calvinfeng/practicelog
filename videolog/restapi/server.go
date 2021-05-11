package restapi

import (
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/calvinfeng/practicelog/youtubeapi"
	"github.com/go-playground/validator"
)

// New returns a video log REST API server.
func New(vStore videolog.Store, pStore practicelog.Store, youtubeAPI youtubeapi.Service, auth bool) videolog.RESTAPI {
	return &server{
		videoLogStore:    vStore,
		practiceLogStore: pStore,
		validate:         validator.New(),
		auth:             auth,
		youtubeAPI:       youtubeAPI,
	}
}

type server struct {
	videoLogStore    videolog.Store
	practiceLogStore practicelog.Store
	validate         *validator.Validate
	auth             bool
	youtubeAPI       youtubeapi.Service
}
