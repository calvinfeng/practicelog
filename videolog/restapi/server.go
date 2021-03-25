package restapi

import (
	"net/http"

	"github.com/calvinfeng/practicelog/videolog"
	"github.com/calvinfeng/practicelog/videolog/store"
	"github.com/go-playground/validator"
	"github.com/labstack/echo/v4"
	"github.com/pkg/errors"
)

func New(store videolog.Store, auth bool) videolog.RESTAPI {
	return &server{
		store:    store,
		validate: validator.New(),
		auth:     auth,
	}
}

const defaultUsername = "calvin.j.feng@gmail.com"

type server struct {
	store    videolog.Store
	validate *validator.Validate
	auth     bool
}

func (s *server) ListVideoLogEntries(c echo.Context) error {
	resp := new(VideoLogEntryListJSONResponse)
	var err error

	resp.MonthlyProgressRecordings, err = s.store.SelectVideoLogEntries(store.IsMonthlyProgress(true))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "server failed to query database").Error())
	}

	resp.PracticeRecordings, err = s.store.SelectVideoLogEntries(store.IsMonthlyProgress(false))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "server failed to query database").Error())
	}

	return c.JSON(http.StatusOK, resp)
}

func (s *server) ListProgressSummaries(c echo.Context) error {
	resp := new(ProgressSummaryJSONResponse)
	var err error

	resp.ProgressSummaries, err = s.store.SelectProgressSummaries()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "server failed to query database").Error())
	}

	return c.JSON(http.StatusOK, resp)
}
