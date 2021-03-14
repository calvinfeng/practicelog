package videolog

import (
	"fmt"
	"time"

	"github.com/calvinfeng/practicelog/youtubeapi"

	"github.com/Masterminds/squirrel"
)

const OrientationLandscape = "landscape"
const OrientationPortrait = "portrait"

// Entry contains metadata of a YouTube video that I uploaded.
type Entry struct {
	ID                string                          `json:"id"`
	Published         time.Time                       `json:"published"`
	VideoOrientation  string                          `json:"video_orientation"`
	Title             string                          `json:"title"`
	Description       string                          `json:"description"`
	IsMonthlyProgress bool                            `json:"is_monthly_progress"`
	Thumbnails        map[string]youtubeapi.Thumbnail `json:"thumbnails"`
}

func (e *Entry) String() (str string) {
	str = "==================================================\n"
	str += fmt.Sprintf("Video ID: %s\n", e.ID)
	str += fmt.Sprintf("Published: %s\n", e.Published)
	str += fmt.Sprintf("Title: %s\n", e.Title)
	str += fmt.Sprintf("Description: %s\n", e.Description)
	str += fmt.Sprintf("Thumbnails: %s\n", e.Thumbnails)
	str += "==================================================\n"
	return
}

type (
	SQLFilter func(squirrel.Eq)

	Store interface {
		BatchUpsertVideoLogEntries(entries ...*Entry) (int64, error)
		SelectVideoLogEntries(limit, offset uint64, filters ...SQLFilter) ([]*Entry, error)
	}
)
