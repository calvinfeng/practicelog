package logserver

import (
	"fmt"
	"github.com/calvinfeng/practicelog/auth"
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/pkg/errors"
	"net/http"
)

func (s *server) ListPracticeLogLabels(c echo.Context) error {
	resp := new(PracticeLogLabelListJSONResponse)
	labels, err := s.store.SelectLogLabels()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			fmt.Errorf("server failed to query store %w", err))
	}
	resp.Count = len(labels)
	resp.Results = labels
	return c.JSON(http.StatusOK, resp)
}

func (s *server) CreatePracticeLogLabel(c echo.Context) error {
	email := defaultUsername
	if s.auth {
		var err error
		email, err = auth.GetEmailFromContext(c)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "email is not found in provided ID token")
		}
	}

	label := new(practicelog.Label)
	if err := c.Bind(label); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "failed to parse JSON data").Error())
	}
	label.Username = email

	if err := s.validate.Struct(label); err != nil {
		fieldErrors := err.(validator.ValidationErrors)
		jsonM := make(map[string]string)
		for _, fieldErr := range fieldErrors {
			field := fieldErr.Field()
			err := fieldErr.(error)
			jsonM[field] = err.Error()
		}
		return echo.NewHTTPError(http.StatusBadRequest, jsonM)
	}

	if _, err := s.store.BatchInsertLogLabels(label); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to insert to database").Error())
	}

	return c.JSON(http.StatusCreated, IDResponse{ID: label.ID})
}

func (s *server) UpdatePracticeLogLabel(c echo.Context) error {
	email := defaultUsername
	if s.auth {
		var err error
		email, err = auth.GetEmailFromContext(c)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "email is not found in provided ID token")
		}
	}

	label := new(practicelog.Label)
	if err := c.Bind(label); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "failed to parse JSON data").Error())
	}
	label.Username = email

	if id, err := uuid.Parse(c.Param("label_id")); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "log label id in path parameter is not a valid uuid ").Error())
	} else {
		if id != label.ID {
			return echo.NewHTTPError(http.StatusBadRequest,
				"payload log label ID does not match with path log label ID")
		}
	}

	if err := s.validate.Struct(label); err != nil {
		fieldErrors := err.(validator.ValidationErrors)
		jsonM := make(map[string]string)
		for _, fieldErr := range fieldErrors {
			field := fieldErr.Field()
			err := fieldErr.(error)
			jsonM[field] = err.Error()
		}
		return echo.NewHTTPError(http.StatusBadRequest, jsonM)
	}

	if err := s.store.UpdateLogLabel(label); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to update log label").Error())
	}

	return c.JSON(http.StatusOK, label)
}

func (s *server) DeletePracticeLogLabel(c echo.Context) error {
	id, err := uuid.Parse(c.Param("label_id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "log label id in path parameter is not a valid uuid ").Error())
	}

	if err := s.store.DeleteLogLabel(&practicelog.Label{
		ID: id,
	}); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to delete entry from database").Error())
	}

	return c.JSON(http.StatusOK, IDResponse{ID: id})
}
