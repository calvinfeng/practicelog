package logserver

import (
	"fmt"
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/calvinfeng/practicelog/practicelog/logstore"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/pkg/errors"
	"net/http"
)

func New(store practicelog.Store, auth bool) practicelog.HTTPServer {
	return &server{
		store:    store,
		validate: validator.New(),
		auth:     auth,
	}
}

const defaultUsername = "calvin.j.feng@gmail.com"

type server struct {
	store    practicelog.Store
	validate *validator.Validate
	auth     bool
}

func (s *server) ListLogLabelDurations(c echo.Context) error {
	durations, err := s.store.ListLogLabelDurations()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to query database").Error())
	}

	return c.JSON(http.StatusOK, PracticeLogLabelDurationListJSONResponse{
		Count:   len(durations),
		Results: durations,
	})
}

func (s *server) GetLogLabelDurationSum(c echo.Context) error {
	id, err := uuid.Parse(c.Param("label_id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "log label id in path parameter is not a valid uuid ").Error())
	}

	// TODO: Implement a single GET for label from store
	labels, err := s.store.SelectLogLabels()
	var target *practicelog.Label
	for _, label := range labels {
		if label.ID == id {
			target = label
		}
	}

	if target == nil {
		return echo.NewHTTPError(http.StatusNotFound, fmt.Errorf("label %s not found", id))
	}

	dur, err := s.store.SumLogEntryDuration(logstore.ByLabelIDList([]string{c.Param("label_id")}))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to query database"))
	}

	return c.JSON(http.StatusOK, PracticeLogLabelDurationResponse{
		Label:    *target,
		Duration: dur,
	})
}

func (s *server) GetLogEntryDurationSum(c echo.Context) error {
	mins, err := s.store.SumAllLogEntryDuration()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to query database"))
	}

	return c.JSON(http.StatusOK, PracticeLogEntryTotalDurationResponse{
		InMinutes: mins,
		InHours:   float64(mins) / 60,
	})
}
