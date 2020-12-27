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

func (s *server) ListPracticeLogEntries(c echo.Context) error {
	count, err := s.store.CountLogEntries()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "server failed to query database").Error())
	}

	limit, offset := getLimitOffsetFromContext(c)

	resp := new(PracticeLogEntryListJSONResponse)
	if count > int(limit)+int(offset) {
		resp.More = true
	}

	entries, err := s.store.SelectLogEntries(limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			fmt.Errorf("server failed to query store %w", err))
	}
	resp.Results = entries
	resp.Count = len(entries)

	return c.JSON(http.StatusOK, resp)
}

func (s *server) CreatePracticeLogEntry(c echo.Context) error {
	entry := new(practicelog.Entry)
	if err := c.Bind(entry); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "failed to parse JSON data").Error())
	}

	if err := s.validate.Struct(entry); err != nil {
		fieldErrors := err.(validator.ValidationErrors)
		jsonM := make(map[string]string)
		for _, fieldErr := range fieldErrors {
			field := fieldErr.Field()
			err := fieldErr.(error)
			jsonM[field] = err.Error()
		}
		return echo.NewHTTPError(http.StatusBadRequest, jsonM)
	}

	if _, err := s.store.BatchInsertLogEntries(entry); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to insert to database").Error())
	}

	return c.JSON(http.StatusCreated, IDResponse{ID: entry.ID})
}

func (s *server) UpdatePracticeLogEntry(c echo.Context) error {
	entry := new(practicelog.Entry)
	if err := c.Bind(entry); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "failed to parse JSON data").Error())
	}

	if id, err := uuid.Parse(c.Param("entry_id")); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "log entry id in path parameter is not a valid uuid ").Error())
	} else {
		if id != entry.ID {
			return echo.NewHTTPError(http.StatusBadRequest,
				"payload log entry ID does not match with path log entry ID")
		}
	}

	if err := s.validate.Struct(entry); err != nil {
		fieldErrors := err.(validator.ValidationErrors)
		jsonM := make(map[string]string)
		for _, fieldErr := range fieldErrors {
			field := fieldErr.Field()
			err := fieldErr.(error)
			jsonM[field] = err.Error()
		}
		return echo.NewHTTPError(http.StatusBadRequest, jsonM)
	}

	for i, assignment := range entry.Assignments {
		if assignment.Position != i {
			return echo.NewHTTPError(http.StatusBadRequest,
				"assignments must have correct position values, [0, ..., N]")
		}
	}

	if err := s.store.UpdateLogEntry(entry); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to update log assignments").Error())
	}

	return c.JSON(http.StatusOK, entry)
}

func (s *server) UpdatePracticeLogAssignments(c echo.Context) error {
	entry := new(practicelog.Entry)
	if err := c.Bind(entry); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "failed to parse JSON data").Error())
	}

	for i, assignment := range entry.Assignments {
		if assignment.Position != i {
			return echo.NewHTTPError(http.StatusBadRequest,
				"assignments must have correct position values, [0, ..., N]")
		}
	}

	if err := s.store.UpdateLogAssignments(entry); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to update log assignments").Error())
	}

	entryID := c.Param("entry_id")

	entries, err := s.store.SelectLogEntries(1, 0, logstore.ByID(entryID))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			fmt.Errorf("server failed to query store %w", err))
	}

	return c.JSON(http.StatusOK, entries[0])
}

func (s *server) DeletePracticeLogEntry(c echo.Context) error {
	id, err := uuid.Parse(c.Param("entry_id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "log label id in path parameter is not a valid uuid ").Error())
	}

	if err := s.store.DeleteLogEntry(&practicelog.Entry{
		ID: id,
	}); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to delete entry from database").Error())
	}

	return c.JSON(http.StatusOK, IDResponse{ID: id})
}
