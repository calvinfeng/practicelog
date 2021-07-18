package restapi

import (
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/calvinfeng/practicelog/youtubeapi"
	"github.com/go-playground/validator"
)

func New(vStore videolog.Store, pStore practicelog.Store, youtubeAPI youtubeapi.Service, auth bool) videolog.RESTAPI {
	return &service{
		apiV1: &apiV1{
			videoLogStore:    vStore,
			practiceLogStore: pStore,
			validate:         validator.New(),
			auth:             auth,
			youtubeAPI:       youtubeAPI,
		},
		apiV2: &apiV2{
			videoLogStore:    vStore,
			practiceLogStore: pStore,
			validate:         validator.New(),
			auth:             auth,
			youtubeAPI:       youtubeAPI,
		},
	}
}

type service struct {
	apiV1 *apiV1
	apiV2 *apiV2
}

func (s *service) V1() videolog.APIv1 {
	return s.apiV1
}

func (s *service) V2() videolog.APIv2 {
	return s.apiV2
}

type apiV1 struct {
	videoLogStore    videolog.Store
	practiceLogStore practicelog.Store
	validate         *validator.Validate
	auth             bool
	youtubeAPI       youtubeapi.Service
}

type apiV2 struct {
	videoLogStore    videolog.Store
	practiceLogStore practicelog.Store
	validate         *validator.Validate
	auth             bool
	youtubeAPI       youtubeapi.Service
}
