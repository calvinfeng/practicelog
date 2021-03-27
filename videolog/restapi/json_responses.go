package restapi

import (
	"github.com/calvinfeng/practicelog/videolog"
	"time"
)

type VideoGroup struct {
	Year               int               `json:"year"`
	Month              time.Month        `json:"month"`
	PracticeRecordings []*videolog.Entry `json:"practice_recordings"`
	ProgressRecordings []*videolog.Entry `json:"progress_recordings"`
}
