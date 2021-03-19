package server

import (
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/google/uuid"
)

type PracticeLogEntryListJSONResponse struct {
	Count   int                  `json:"count"`
	Results []*practicelog.Entry `json:"results"`
	More    bool                 `json:"more"`
}

type PracticeLogLabelListJSONResponse struct {
	Count   int                  `json:"count"`
	Results []*practicelog.Label `json:"results"`
}

type IDResponse struct {
	ID uuid.UUID `json:"id"`
}

type PracticeLogLabelDurationResponse struct {
	practicelog.Label
	Duration int32 `json:"duration"`
}

type PracticeLogEntryTotalDurationResponse struct {
	InHours   float64 `json:"in_hours"`
	InMinutes int32   `json:"in_minutes"`
}

type PracticeLogLabelDurationListJSONResponse struct {
	Count   int                          `json:"count"`
	Results []*practicelog.LabelDuration `json:"results"`
}
