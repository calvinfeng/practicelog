package restapi

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/calvinfeng/practicelog/auth"
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/calvinfeng/practicelog/youtubeapi"
	"github.com/go-playground/validator"
	"github.com/labstack/echo/v4"
	"github.com/pkg/errors"
)

func New(vStore videolog.Store, pStore practicelog.Store, youtubeAPI youtubeapi.Service, auth bool) videolog.RESTAPI {
	return &server{
		videoLogStore:    vStore,
		practiceLogStore: pStore,
		validate:         validator.New(),
		auth:             auth,
		youtubeAPI:       youtubeAPI,
	}
}

type server struct {
	videoLogStore    videolog.Store
	practiceLogStore practicelog.Store
	validate         *validator.Validate
	auth             bool
	youtubeAPI       youtubeapi.Service
}

// Todo: This is slow, we should queue it up instead of running it synchronously.

func (s *server) LoadFromYouTubePlaylist(c echo.Context) error {
	email, err := auth.GetEmailFromContext(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "email is not found in provided ID token")
	}

	body := new(LoadPlaylistBody)
	if err := c.Bind(body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "failed to parse JSON data").Error())
	}

	if body.PracticeRecordingPlaylistID == "" || body.MonthlyProgressPlaylistID == "" {
		return echo.NewHTTPError(http.StatusBadRequest,
			"playlist IDs are required in body payload keys=[practice_recording_playlist_id, monthly_progress_playlist_id]")
	}

	var videos []*videolog.Entry
	videos, err = s.loadPlaylist(body.MonthlyProgressPlaylistID, email, true)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	resp := new(LoadPlaylistResponse)
	resp.MonthlyProgressVideoCount, err = s.videoLogStore.BatchUpsertVideoLogEntries(videos...)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	videos, err = s.loadPlaylist(body.PracticeRecordingPlaylistID, email, false)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	resp.PracticeRecordingVideoCount, err = s.videoLogStore.BatchUpsertVideoLogEntries(videos...)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusCreated, resp)
}

func (s *server) loadPlaylist(playlistID string, username string, isMonthlyProgress bool) ([]*videolog.Entry, error) {
	items, err := s.youtubeAPI.PlaylistItems(playlistID)
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

		sum, err := s.practiceLogStore.SumLogEntryDurationBefore(video.Published)
		if err != nil {
			return nil, fmt.Errorf("failed to sum log entry duration for video %s %s: %w", video.ID, video.Title, err)
		}
		video.MinGuitarPractice = sum
		videos = append(videos, video)
	}

	return videos, nil
}

func (s *server) ListProgressSummaries(c echo.Context) error {
	summaries, err := s.videoLogStore.SelectProgressSummaries()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "server failed to query database").Error())
	}

	return c.JSON(http.StatusOK, summaries)
}
