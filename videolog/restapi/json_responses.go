package restapi

import (
	"time"

	"github.com/calvinfeng/practicelog/videolog"
)

type VideoGroup struct {
	Year               int               `json:"year"`
	Month              time.Month        `json:"month"`
	PracticeRecordings []*videolog.Entry `json:"practice_recordings"`
	ProgressRecordings []*videolog.Entry `json:"progress_recordings"`
}

type LoadPlaylistBody struct {
	MonthlyProgressPlaylistID   string `json:"monthly_progress_playlist_id"`
	PracticeRecordingPlaylistID string `json:"practice_recording_playlist_id"`
}

type LoadPlaylistResponse struct {
	MonthlyProgressVideoCount   int64 `json:"monthly_progress_video_count"`
	PracticeRecordingVideoCount int64 `json:"practice_recording_video_count"`
	IsRequesterOwner            bool  `json:"is_requester_owner;omitempty"`
}
