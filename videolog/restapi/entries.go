package restapi

import (
	"fmt"
	"net/http"

	"github.com/calvinfeng/practicelog/auth"
	"github.com/calvinfeng/practicelog/videolog"
	vstore "github.com/calvinfeng/practicelog/videolog/store"
	"github.com/labstack/echo/v4"
)

func (s *server) ListVideoLogEntries(c echo.Context) error {
	var err error
	var videos []*videolog.Entry
	videos, err = s.videoLogStore.SelectVideoLogEntries()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			fmt.Errorf("server failed to query database %w", err).Error())
	}

	groups := make([]VideoGroup, 0)
	for _, video := range videos {
		lastIndex := len(groups) - 1
		if lastIndex < 0 ||
			(groups[lastIndex].Year != video.Published.Year() || groups[lastIndex].Month != video.Published.Month()) {
			newGroup := VideoGroup{
				Year:               video.Published.Year(),
				Month:              video.Published.Month(),
				PracticeRecordings: make([]*videolog.Entry, 0),
				ProgressRecordings: make([]*videolog.Entry, 0),
			}
			if video.IsMonthlyProgress {
				newGroup.ProgressRecordings = append(newGroup.ProgressRecordings, video)
			} else {
				newGroup.PracticeRecordings = append(newGroup.PracticeRecordings, video)
			}
			groups = append(groups, newGroup)
			continue
		}

		if video.IsMonthlyProgress {
			groups[lastIndex].ProgressRecordings = append(groups[lastIndex].ProgressRecordings, video)
		} else {
			groups[lastIndex].PracticeRecordings = append(groups[lastIndex].PracticeRecordings, video)
		}
	}

	return c.JSON(http.StatusOK, groups)
}

func (s *server) ListVideoLogEntriesByProfileID(c echo.Context) error {
	email, _ := auth.GetEmailFromContext(c)

	profile, err := s.videoLogStore.GetVideoProfileByID(c.Param("profile_id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			fmt.Errorf("video log profile not found %w", err).Error())
	}

	if profile.Username != email && profile.Privacy != videolog.PrivacyPublic {
		return echo.NewHTTPError(http.StatusUnauthorized,
			fmt.Sprint("profile is not public"))
	}

	videos, err := s.videoLogStore.SelectVideoLogEntries(vstore.ByUsername(profile.Username))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			fmt.Errorf("server failed to query database %w", err).Error())
	}

	groups := make([]VideoGroup, 0)
	for _, video := range videos {
		lastIndex := len(groups) - 1
		if lastIndex < 0 ||
			(groups[lastIndex].Year != video.Published.Year() || groups[lastIndex].Month != video.Published.Month()) {
			newGroup := VideoGroup{
				Year:               video.Published.Year(),
				Month:              video.Published.Month(),
				PracticeRecordings: make([]*videolog.Entry, 0),
				ProgressRecordings: make([]*videolog.Entry, 0),
			}
			if video.IsMonthlyProgress {
				newGroup.ProgressRecordings = append(newGroup.ProgressRecordings, video)
			} else {
				newGroup.PracticeRecordings = append(newGroup.PracticeRecordings, video)
			}
			groups = append(groups, newGroup)
			continue
		}

		if video.IsMonthlyProgress {
			groups[lastIndex].ProgressRecordings = append(groups[lastIndex].ProgressRecordings, video)
		} else {
			groups[lastIndex].PracticeRecordings = append(groups[lastIndex].PracticeRecordings, video)
		}
	}

	return c.JSON(http.StatusOK, groups)
}
