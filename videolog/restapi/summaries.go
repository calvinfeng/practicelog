package restapi

import (
	"fmt"
	"net/http"

	"github.com/calvinfeng/practicelog/auth"
	"github.com/calvinfeng/practicelog/videolog"
	vstore "github.com/calvinfeng/practicelog/videolog/store"
	"github.com/labstack/echo/v4"
	"github.com/pkg/errors"
)

func (s *server) ListProgressSummaries(c echo.Context) error {
	summaries, err := s.videoLogStore.SelectProgressSummaries()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "server failed to query database").Error())
	}

	return c.JSON(http.StatusOK, summaries)
}

type progressSummaryResponse struct {
	Summaries        []*videolog.ProgressSummary `json:"summaries"`
	IsRequesterOwner bool                        `json:"is_requester_owner"`
}

func (s *server) ListProgressSummariesByProfileID(c echo.Context) error {
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

	summaries, err := s.videoLogStore.SelectProgressSummaries(vstore.ByUsername(email))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "server failed to query database").Error())
	}

	return c.JSON(http.StatusOK, progressSummaryResponse{
		Summaries:        summaries,
		IsRequesterOwner: profile.Username == email,
	})
}
