package store

import (
	"encoding/json"
	"time"

	"github.com/calvinfeng/practicelog/videolog"
	"github.com/calvinfeng/practicelog/youtubeapi"
)

const VideoLogEntryTable = "video_log_entries"

type DBVideoLogEntry struct {
	ID                string          `db:"id"`
	Username          string          `db:"username"`
	Published         time.Time       `db:"published"`
	VideoOrientation  string          `db:"video_orientation"`
	Title             string          `db:"title"`
	Description       string          `db:"description"`
	IsMonthlyProgress bool            `db:"is_monthly_progress"`
	Thumbnails        json.RawMessage `db:"thumbnails"`
	MinGuitarPractice int32           `db:"minutes_of_guitar_practice"`
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
	row.MinGuitarPractice = model.MinGuitarPractice
	return row
}

func (row *DBVideoLogEntry) toModel() *videolog.Entry {
	thumbnails := make(map[string]youtubeapi.Thumbnail)
	_ = json.Unmarshal(row.Thumbnails, &thumbnails)

	return &videolog.Entry{
		ID:                row.ID,
		Published:         row.Published,
		VideoOrientation:  row.VideoOrientation,
		Title:             row.Title,
		Description:       row.Description,
		IsMonthlyProgress: row.IsMonthlyProgress,
		Thumbnails:        thumbnails,
		Username:          row.Username,
		MinGuitarPractice: row.MinGuitarPractice,
	}
}

const ProgressSummaryTable = "progress_summaries"

type DBProgressSummary struct {
	ID       int64  `db:"id"`
	Username string `db:"username"`
	Year     int64  `db:"year"`
	Month    int64  `db:"month"`
	Title    string `db:"title"`
	Subtitle string `db:"subtitle"`
	Body     string `db:"body"`
}

func (row *DBProgressSummary) fromModel(model *videolog.ProgressSummary) *DBProgressSummary {
	row.ID = model.ID
	row.Username = model.Username
	row.Year = model.Year
	row.Month = model.Month
	row.Title = model.Title
	row.Subtitle = model.Subtitle
	row.Body = model.Body
	return row
}

func (row *DBProgressSummary) toModel() *videolog.ProgressSummary {
	return &videolog.ProgressSummary{
		ID:       row.ID,
		Username: row.Username,
		Year:     row.Year,
		Month:    row.Month,
		Title:    row.Title,
		Subtitle: row.Subtitle,
		Body:     row.Body,
	}
}
