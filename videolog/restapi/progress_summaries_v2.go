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

type progressSummaryResponse struct {
	Summaries        []*videolog.ProgressSummary `json:"summaries"`
	IsRequesterOwner bool                        `json:"is_requester_owner"`
}

func (api *apiV2) ListProgressSummaries(c echo.Context) error {
	email, _ := auth.GetEmailFromContext(c)

	profileID := c.QueryParam("profile")
	if profileID == "" {
		return echo.NewHTTPError(http.StatusBadRequest,
			"query param ?profile= is required")
	}

	profile, err := api.videoLogStore.GetVideoLogProfileByID(profileID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			fmt.Errorf("video log profile not found %w", err).Error())
	}

	if profile.Username != email && profile.Privacy != videolog.PrivacyPublic {
		return echo.NewHTTPError(http.StatusUnauthorized,
			fmt.Sprint("profile is not public"))
	}

	summaries, err := api.videoLogStore.SelectProgressSummaries(vstore.ByUsername(email))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "server failed to query database").Error())
	}

	return c.JSON(http.StatusOK, progressSummaryResponse{
		Summaries:        summaries,
		IsRequesterOwner: profile.Username == email,
	})
}

func (api *apiV2) UpsertProgressSummary(c echo.Context) error {
	email, _ := auth.GetEmailFromContext(c)

	profileID := c.QueryParam("profile")
	if profileID == "" {
		return echo.NewHTTPError(http.StatusBadRequest,
			"query param ?profile= is required")
	}

	profile, err := api.videoLogStore.GetVideoLogProfileByID(profileID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			fmt.Errorf("video log profile not found %w", err).Error())
	}

	if profile.Username != email {
		return echo.NewHTTPError(http.StatusUnauthorized,
			fmt.Sprintf("client %s does not have access to profile %s", email, profile.ID))
	}

	summary := new(videolog.ProgressSummary)
	if err := c.Bind(summary); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "failed to parse JSON data"))
	}

	if err := api.videoLogStore.UpsertProgressSummaries(summary); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrapf(err, "failed to update %d-%d progress summary", summary.Year, summary.Month))
	}

	return c.JSON(http.StatusOK, profile)
}
