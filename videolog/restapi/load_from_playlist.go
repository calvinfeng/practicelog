package restapi

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/calvinfeng/practicelog/auth"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/labstack/echo/v4"
	"github.com/pkg/errors"
)

type loadPlaylistRequestBody struct {
	MonthlyProgressPlaylistID   string `json:"monthly_progress_playlist_id"`
	PracticeRecordingPlaylistID string `json:"practice_recording_playlist_id"`
}

type loadPlaylistResponse struct {
	MonthlyProgressVideoCount   int64 `json:"monthly_progress_video_count"`
	PracticeRecordingVideoCount int64 `json:"practice_recording_video_count"`
}

// Todo: This is slow, we should queue it up instead of running it synchronously.

func (api *apiV2) LoadFromYouTubePlaylist(c echo.Context) error {
	email, err := auth.GetEmailFromContext(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "email is not found in provided ID token")
	}

	profile, err := api.videoLogStore.GetVideoLogProfileByUsername(email)
	if err != nil && profile == nil {
		// Create a profile if not exist
		api.videoLogStore.UpsertVideoLogProfile(&videolog.Profile{
			Username: email,
			Privacy:  videolog.PrivacyPrivate,
		})
	}

	body := new(loadPlaylistRequestBody)
	if err := c.Bind(body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "failed to parse JSON data").Error())
	}

	if body.PracticeRecordingPlaylistID == "" || body.MonthlyProgressPlaylistID == "" {
		return echo.NewHTTPError(http.StatusBadRequest,
			"playlist IDs are required in body payload keys=[practice_recording_playlist_id, monthly_progress_playlist_id]")
	}

	var videos []*videolog.Entry
	videos, err = api.loadPlaylist(body.MonthlyProgressPlaylistID, email, true)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	resp := new(loadPlaylistResponse)
	resp.MonthlyProgressVideoCount, err = api.videoLogStore.BatchUpsertVideoLogEntries(videos...)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	videos, err = api.loadPlaylist(body.PracticeRecordingPlaylistID, email, false)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	resp.PracticeRecordingVideoCount, err = api.videoLogStore.BatchUpsertVideoLogEntries(videos...)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusCreated, resp)
}

func (api *apiV2) loadPlaylist(playlistID string, username string, isMonthlyProgress bool) ([]*videolog.Entry, error) {
	items, err := api.youtubeAPI.PlaylistItems(playlistID)
	if err != nil {
		return nil, err
	}

	if len(items) == 0 {
		return nil, fmt.Errorf("YouTube API has returned 0 items for playlist %s",
			playlistID)
	}

	videos := make([]*videolog.Entry, 0, len(items))
	for _, item := range items {
		// If published is zero, this video is deleted. However, YouTube is a distributed system so
		// it takes a while to update.
		if item.ContentDetails.Published.IsZero() {
			continue
		}
		video := &videolog.Entry{
			ID:                item.ContentDetails.VideoID,
			Published:         item.ContentDetails.Published,
			Title:             item.Snippet.Title,
			Description:       item.Snippet.Description,
			IsMonthlyProgress: isMonthlyProgress,
			Thumbnails:        item.Snippet.Thumbnails,
			Username:          username,
		}

		if strings.Contains(item.Snippet.Title, "AR 9:16") {
			video.VideoOrientation = videolog.OrientationPortrait
		} else {
			video.VideoOrientation = videolog.OrientationLandscape
		}

		sum, err := api.practiceLogStore.SumLogEntryDurationBefore(video.Published)
		if err != nil {
			return nil, fmt.Errorf("failed to sum log entry duration for video %s %s: %w", video.ID, video.Title, err)
		}
		video.MinGuitarPractice = sum
		videos = append(videos, video)
	}

	return videos, nil
}
