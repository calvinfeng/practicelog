package restapi

import (
	"fmt"
	"github.com/sirupsen/logrus"
	"net/http"

	"github.com/calvinfeng/practicelog/auth"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/labstack/echo/v4"
	"github.com/pkg/errors"
)

func (api *apiV2) GetMyVideoLogProfile(c echo.Context) error {
	email, err := auth.GetEmailFromContext(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err)
	}

	profile, err := api.videoLogStore.GetVideoLogProfileByUsername(email)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			fmt.Errorf("video log profile not found %w", err).Error())
	}

	return c.JSON(http.StatusOK, profile)
}

func (api *apiV2) UpsertMyVideoLogProfile(c echo.Context) error {
	email, err := auth.GetEmailFromContext(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err)
	}

	var profile *videolog.Profile
	profile, err = api.videoLogStore.GetVideoLogProfileByUsername(email)
	if err != nil {
		logrus.Warnf("profile not found for user %s, proceed to create one", email)
		profile = new(videolog.Profile)
	}

	if err := c.Bind(profile); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "failed to parse JSON data"))
	}

	if profile.Privacy != videolog.PrivacyPrivate &&
		profile.Privacy != videolog.PrivacyUnlisted &&
		profile.Privacy != videolog.PrivacyPublic {
		return echo.NewHTTPError(http.StatusBadRequest,
			fmt.Sprintf("%s is not a valid option for privacy setting", profile.Privacy))
	}

	profile.Username = email
	if err := api.videoLogStore.UpsertVideoLogProfile(profile); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to update profile in database"))
	}

	return c.JSON(http.StatusOK, profile)
}
