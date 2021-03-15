package logstore

import (
	"encoding/json"
	"time"

	"github.com/calvinfeng/practicelog/videolog"
	"github.com/calvinfeng/practicelog/youtubeapi"
)

const VideoLogEntryTable = "video_log_entries"

type DBVideoLogEntry struct {
	ID                string          `db:"id"`
	Published         time.Time       `db:"published"`
	VideoOrientation  string          `db:"video_orientation"`
	Title             string          `db:"title"`
	Description       string          `db:"description"`
	IsMonthlyProgress bool            `db:"is_monthly_progress"`
	Thumbnails        json.RawMessage `db:"thumbnails"`
	Username          string          `db:"username"`
}

func (row *DBVideoLogEntry) fromModel(model *videolog.Entry) *DBVideoLogEntry {
	row.ID = model.ID
	row.Published = model.Published
	row.VideoOrientation = model.VideoOrientation
	row.Title = model.Title
	row.Description = model.Description
	row.IsMonthlyProgress = model.IsMonthlyProgress
	row.Thumbnails, _ = json.Marshal(model.Thumbnails)
	row.Username = model.Username
	return row
}

func (row *DBVideoLogEntry) toModel() *videolog.Entry {
	thumbnails := make(map[string]youtubeapi.Thumbnail)
	json.Unmarshal(row.Thumbnails, &thumbnails)

	return &videolog.Entry{
		ID:                row.ID,
		Published:         row.Published,
		VideoOrientation:  row.VideoOrientation,
		Title:             row.Title,
		Description:       row.Description,
		IsMonthlyProgress: row.IsMonthlyProgress,
		Thumbnails:        thumbnails,
		Username:          row.Username,
	}
}
