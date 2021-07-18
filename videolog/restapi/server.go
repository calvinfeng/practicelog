package restapi

import (
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/calvinfeng/practicelog/youtubeapi"
	"github.com/go-playground/validator"
)

func NewAPIv1(vStore videolog.Store, pStore practicelog.Store, youtubeAPI youtubeapi.Service, auth bool) videolog.APIv1 {
	return &apiV1{
		videoLogStore:    vStore,
		practiceLogStore: pStore,
		validate:         validator.New(),
		auth:             auth,
		youtubeAPI:       youtubeAPI,
	}
}

type apiV1 struct {
	videoLogStore    videolog.Store
	practiceLogStore practicelog.Store
	validate         *validator.Validate
	auth             bool
	youtubeAPI       youtubeapi.Service
}

func NewAPIv2(vStore videolog.Store, pStore practicelog.Store, youtubeAPI youtubeapi.Service, auth bool) videolog.APIv2 {
	return &apiV2{
		videoLogStore:    vStore,
		practiceLogStore: pStore,
		validate:         validator.New(),
		auth:             auth,
		youtubeAPI:       youtubeAPI,
	}
}

type apiV2 struct {
	videoLogStore    videolog.Store
	practiceLogStore practicelog.Store
	validate         *validator.Validate
	auth             bool
	youtubeAPI       youtubeapi.Service
}
