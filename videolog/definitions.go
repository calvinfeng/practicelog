package videolog

import (
	"github.com/Masterminds/squirrel"
	"time"
)

const OrientationLandscape = "landscape"
const OrientationPortrait = "portrait"

// Entry contains metadata of a YouTube video that I uploaded.
type Entry struct {
	ID                string    `json:"id"`
	Published         time.Time `json:"published"`
	VideoOrientation  string    `json:"video_orientation"`
	Title             string    `json:"title"`
	Description       string    `json:"description"`
	IsMonthlyProgress bool      `json:"is_monthly_progress"`
}

type (
	SQLFilter func(squirrel.Eq)

	Store interface {
		BatchInsertVideoLogEntries(entries ...*Entry) (int64, error)
		SelectVideoLogEntries(limit, offset uint64, filters ...SQLFilter) ([]*Entry, error)
	}
)
