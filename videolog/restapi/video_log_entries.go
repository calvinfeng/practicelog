package restapi

import (
	"fmt"
	"net/http"
	"time"

	"github.com/calvinfeng/practicelog/auth"
	"github.com/calvinfeng/practicelog/videolog"
	vstore "github.com/calvinfeng/practicelog/videolog/store"
	"github.com/labstack/echo/v4"
)

type videoGroup struct {
	Year               int               `json:"year"`
	Month              time.Month        `json:"month"`
	PracticeRecordings []*videolog.Entry `json:"practice_recordings"`
	ProgressRecordings []*videolog.Entry `json:"progress_recordings"`
}

type videoLogEntryResponse struct {
	VideoGroups      []videoGroup `json:"video_groups"`
	IsRequesterOwner bool         `json:"is_requester_owner"`
}

func (s *server) ListVideoLogEntriesByProfileID(c echo.Context) error {
	email, _ := auth.GetEmailFromContext(c)

	profileID := c.QueryParam("profile")
	if profileID == "" {
		return echo.NewHTTPError(http.StatusBadRequest,
			"query param ?profile= is required")
	}

	profile, err := s.videoLogStore.GetVideoLogProfileByID(profileID)
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

	groups := make([]videoGroup, 0)
	for _, video := range videos {
		lastIndex := len(groups) - 1
		if lastIndex < 0 ||
			(groups[lastIndex].Year != video.Published.Year() || groups[lastIndex].Month != video.Published.Month()) {
			newGroup := videoGroup{
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

	return c.JSON(http.StatusOK, videoLogEntryResponse{
		VideoGroups:      groups,
		IsRequesterOwner: profile.Username == email,
	})
}
