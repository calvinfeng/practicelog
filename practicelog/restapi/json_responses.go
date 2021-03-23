package restapi

import (
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/google/uuid"
)

type entryListJSONResponse struct {
	Count   int                  `json:"count"`
	Results []*practicelog.Entry `json:"results"`
	More    bool                 `json:"more"`
}

type labelListJSONResponse struct {
	Count   int                  `json:"count"`
	Results []*practicelog.Label `json:"results"`
}

type IDResponse struct {
	ID uuid.UUID `json:"id"`
}

type labelDurationJSONResponse struct {
	practicelog.Label
	Duration int32 `json:"duration"`
}

type entryTotalDurationJSONResponse struct {
	InHours   float64 `json:"in_hours"`
	InMinutes int32   `json:"in_minutes"`
}

type labelDurationListJSONResponse struct {
	Count   int                          `json:"count"`
	Results []*practicelog.LabelDuration `json:"results"`
}

type durationTimeSeriesJSONResponse struct {
	Count      int                   `json:"count"`
	TimeSeries []timeSeriesDataPoint `json:"time_series"`
	Group      group                 `json:"group"`
}

type group string

const (
	byMonth group = "by_month"
	byYear  group = "by_year"
	byDay   group = "by_day"
)

// NOTE: Front-end renders date as string for both timeline and charts
type timeSeriesDataPoint struct {
	Year       int     `json:"year,omitempty"`
	Month      string  `json:"month,omitempty"`
	Day        int     `json:"day,omitempty"`
	AccumMins  int32   `json:"accum_mins"`
	AccumHours float32 `json:"accum_hours"`
}
