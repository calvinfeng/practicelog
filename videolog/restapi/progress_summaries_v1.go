package restapi

import (
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
	panic("implement me")
}
