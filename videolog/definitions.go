package videolog

import (
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/calvinfeng/practicelog/youtubeapi"
	"github.com/labstack/echo/v4"

	"github.com/Masterminds/squirrel"
)

// This is going to be deprecated. I will assume all videos to be landscape format.
const (
	OrientationLandscape = "landscape"
	OrientationPortrait  = "portrait"
)

// Entry contains metadata of a YouTube video that I uploaded.
type Entry struct {
	ID                string                          `json:"id"`
	Username          string                          `json:"username"`
	Published         time.Time                       `json:"published"`
	VideoOrientation  string                          `json:"video_orientation"`
	Title             string                          `json:"title"`
	Description       string                          `json:"description"`
	IsMonthlyProgress bool                            `json:"is_monthly_progress"`
	Thumbnails        map[string]youtubeapi.Thumbnail `json:"thumbnails"`
	MinGuitarPractice int32                           `json:"minutes_of_guitar_practice,omitempty"`
}

func (e *Entry) String() (str string) {
	str = "==================================================\n"
	str += fmt.Sprintf("Video ID: %s\n", e.ID)
	str += fmt.Sprintf("Published: %s\n", e.Published)
	str += fmt.Sprintf("Title: %s\n", e.Title)
	str += fmt.Sprintf("Description: %s\n", e.Description)
	str += fmt.Sprintf("Thumbnails: %v\n", e.Thumbnails)
	str += "==================================================\n"
	return
}

// ProgressSummary allows user to summarize a monthly progress.
type ProgressSummary struct {
	ID       uuid.UUID `json:"id"`
	Username string    `json:"username"`
	Year     int64     `json:"year"`
	Month    int64     `json:"month"`
	Title    string    `json:"title"`
	Subtitle string    `json:"subtitle"`
	Body     string    `json:"body"`
}

// This is the set of privacy settings.
const (
	PrivacyPublic   = "PUBLIC"
	PrivacyUnlisted = "UNLISTED"
	PrivacyPrivate  = "PRIVATE"
)

// Profile is a video log profile for configuring privacy.
type Profile struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Privacy  string `json:"privacy"`
}

type (
	// RESTAPI provides Echo server compatible handlers.
	RESTAPI interface {
		// Deprecate these as I move forward with profile based video log.
		ListVideoLogEntries(echo.Context) error
		ListProgressSummaries(echo.Context) error

		// New API(s)
		// GetMyVideoLogProfile fetches profile with privacy settings.
		GetMyVideoLogProfile(echo.Context) error
		// UpsertMyVideoLogProfile allows user to set privacy level.
		UpsertMyVideoLogProfile(echo.Context) error

		ListProgressSummariesByProfileID(echo.Context) error
		UpsertProgressSummary(echo.Context) error

		ListVideoLogEntriesByProfileID(echo.Context) error
		LoadFromYouTubePlaylist(echo.Context) error
	}

	// SQLFilter applies filter to store functions.
	SQLFilter func(squirrel.Eq)

	// Store is a DB-backed store.
	Store interface {
		SelectVideoLogEntries(filters ...SQLFilter) ([]*Entry, error)
		BatchUpsertVideoLogEntries(entries ...*Entry) (int64, error)

		SelectProgressSummaries(filters ...SQLFilter) ([]*ProgressSummary, error)
		BatchUpsertProgressSummaries(summaries ...*ProgressSummary) (int64, error)
		UpsertProgressSummaries(summary *ProgressSummary) error

		GetVideoLogProfileByID(id string) (*Profile, error)
		GetVideoLogProfileByUsername(username string) (*Profile, error)
		UpsertVideoLogProfile(*Profile) error
	}
)
