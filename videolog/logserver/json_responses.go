package logserver

import "github.com/calvinfeng/practicelog/videolog"

type VideoLogEntryListJSONResponse struct {
	PracticeRecordings        []*videolog.Entry `json:"practice_recordings"`
	MonthlyProgressRecordings []*videolog.Entry `json:"monthly_progress_recordings"`
}
