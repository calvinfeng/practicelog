package restapi

import (
	"fmt"
	"net/http"

	"github.com/calvinfeng/practicelog/auth"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/labstack/echo/v4"
	"github.com/pkg/errors"
)

func (s *server) GetMyVideoLogProfile(c echo.Context) error {
	email, err := auth.GetEmailFromContext(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err)
	}

	profile, err := s.videoLogStore.GetVideoLogProfileByUsername(email)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			fmt.Errorf("video log profile not found %w", err).Error())
	}

	return c.JSON(http.StatusOK, profile)
}

func (s *server) UpdateMyVideoLogProfile(c echo.Context) error {
	email, err := auth.GetEmailFromContext(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err)
	}

	profile, err := s.videoLogStore.GetVideoLogProfileByUsername(email)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			fmt.Sprintf("profile not found for user %s", email))
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
	if err := s.videoLogStore.UpsertVideoLogProfile(profile); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to update profile in database"))
	}

	return c.JSON(http.StatusOK, profile)
}
