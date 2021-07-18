package restapi

import (
	"github.com/calvinfeng/practicelog/auth"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/pkg/errors"
	"net/http"
)

func (api *apiV1) ListProgressSummaries(c echo.Context) error {
	summaries, err := api.videoLogStore.SelectProgressSummaries()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "server failed to query database").Error())
	}

	return c.JSON(http.StatusOK, summaries)
}

func (api *apiV1) UpsertProgressSummary(c echo.Context) error {
	email, err := auth.GetEmailFromContext(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "email is not found in provided ID token")
	}

	summary := new(videolog.ProgressSummary)
	if err := c.Bind(summary); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "failed to parse JSON data").Error())
	}
	summary.Username = email

	if c.Param("summary_id") == "" {
		if err := api.videoLogStore.UpsertProgressSummaries(summary); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError,
				errors.Wrapf(err, "failed to create %d-%d progress summary", summary.Year, summary.Month))
		}
		return c.JSON(http.StatusCreated, IDResponse{ID: summary.ID})
	} else {
		if id, err := uuid.Parse(c.Param("summary_id")); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest,
				errors.Wrap(err, "summary id in path parameter is not a valid uuid ").Error())
		} else {
			if id != summary.ID {
				return echo.NewHTTPError(http.StatusBadRequest,
					"payload summary ID does not match with path summary ID")
			}
		}
		if err := api.videoLogStore.UpsertProgressSummaries(summary); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError,
				errors.Wrapf(err, "failed to update %d-%d progress summary", summary.Year, summary.Month))
		}
		return c.JSON(http.StatusOK, summary)
	}
}
