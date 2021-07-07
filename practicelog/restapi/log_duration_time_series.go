package restapi

import (
	"fmt"
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/labstack/echo/v4"
	"github.com/pkg/errors"
	"net/http"
)

func (s *server) ListLogLabelDurations(c echo.Context) error {
	durations, err := s.store.ListLogLabelDurations()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to query database").Error())
	}

	return c.JSON(http.StatusOK, labelDurationListJSONResponse{
		Count:   len(durations),
		Results: durations,
	})
}

func (s *server) GetLogEntryDurationSum(c echo.Context) error {
	inMinutes, err := s.store.SumLogEntryDuration()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to query database").Error())
	}

	return c.JSON(http.StatusOK, entryTotalDurationJSONResponse{
		InMinutes: inMinutes,
		InHours:   float64(inMinutes) / 60,
	})
}

func (s *server) GetLogEntryDurationTimeSeries(c echo.Context) error {
	var inSameBucket func(timeSeriesDataPoint, *practicelog.Entry) bool
	grouping := group(c.QueryParam("group"))

	switch grouping {
	case byDay:
		inSameBucket = func(prev timeSeriesDataPoint, entry *practicelog.Entry) bool {
			return prev.Year == entry.Date.Year() &&
				prev.Month == entry.Date.Month() &&
				prev.Day == entry.Date.Day()
		}
	case byMonth:
		inSameBucket = func(prev timeSeriesDataPoint, entry *practicelog.Entry) bool {
			return prev.Year == entry.Date.Year() && prev.Month == entry.Date.Month()
		}
	case byYear:
		inSameBucket = func(prev timeSeriesDataPoint, entry *practicelog.Entry) bool {
			return prev.Year == entry.Date.Year()
		}
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "query parameter ?group=[by_day, by_month, by_year] is required")
	}

	count, err := s.store.CountLogEntries()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to query database for log entry count").Error())
	}

	entries, err := s.store.SelectLogEntries(uint64(count), 0)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to query database for log entries").Error())
	}

	// TODO: Refactor the bucketing strategy

	timeSeries := make([]timeSeriesDataPoint, 0)
	var accum int32
	for i := len(entries) - 1; i >= 0; i-- {
		if len(timeSeries) > 0 {
			lastEl := timeSeries[len(timeSeries)-1]
			if inSameBucket(lastEl, entries[i]) {
				accum += entries[i].Duration
				timeSeries[len(timeSeries)-1].Value = float32(accum)
				continue
			}
		}
		accum = entries[i].Duration

		year, month, day := entries[i].Date.Date()
		newDataPoint := timeSeriesDataPoint{Value: float32(accum)}

		switch grouping {
		case byDay:
			newDataPoint.Day = day
			newDataPoint.Month = month
			newDataPoint.Year = year
			newDataPoint.Key = fmt.Sprintf("%d %s %02d", year, month.String(), day)
		case byMonth:
			newDataPoint.Month = entries[i].Date.Month()
			newDataPoint.Year = entries[i].Date.Year()
			newDataPoint.Key = fmt.Sprintf("%d %s", year, month.String())
		case byYear:
			newDataPoint.Year = entries[i].Date.Year()
			newDataPoint.Key = fmt.Sprintf("%d", year)
		}
		timeSeries = append(timeSeries, newDataPoint)
	}

	return c.JSON(http.StatusOK, durationTimeSeriesJSONResponse{
		Count:      count,
		TimeSeries: timeSeries,
		Group:      grouping,
	})
}

func (s *server) GetLogEntryDurationCumulativeSumTimeSeries(c echo.Context) error {
	var inSameBucket func(timeSeriesDataPoint, *practicelog.Entry) bool
	grouping := group(c.QueryParam("group"))

	switch grouping {
	case byDay:
		inSameBucket = func(prev timeSeriesDataPoint, entry *practicelog.Entry) bool {
			return prev.Year == entry.Date.Year() &&
				prev.Month == entry.Date.Month() &&
				prev.Day == entry.Date.Day()
		}
	case byMonth:
		inSameBucket = func(prev timeSeriesDataPoint, entry *practicelog.Entry) bool {
			return prev.Year == entry.Date.Year() && prev.Month == entry.Date.Month()
		}
	case byYear:
		inSameBucket = func(prev timeSeriesDataPoint, entry *practicelog.Entry) bool {
			return prev.Year == entry.Date.Year()
		}
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "query parameter ?group=[by_day, by_month, by_year] is required")
	}

	count, err := s.store.CountLogEntries()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to query database for log entry count").Error())
	}

	entries, err := s.store.SelectLogEntries(uint64(count), 0)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			errors.Wrap(err, "failed to query database for log entries").Error())
	}

	// Entries are in descending order by date. The only thing I need to change is the map key for by day, by month,
	// or by year.
	timeSeries := make([]timeSeriesDataPoint, 0)
	var accum int32 = 0
	for i := len(entries) - 1; i >= 0; i-- {
		accum += entries[i].Duration

		if len(timeSeries) > 0 {
			lastEl := timeSeries[len(timeSeries)-1]
			if inSameBucket(lastEl, entries[i]) {
				timeSeries[len(timeSeries)-1].Value = float32(accum) / 60
				continue
			}
		}

		year, month, day := entries[i].Date.Date()
		newDataPoint := timeSeriesDataPoint{Value: float32(accum) / 60}
		switch grouping {
		case byDay:
			newDataPoint.Day = day
			newDataPoint.Month = month
			newDataPoint.Year = year
			newDataPoint.Key = fmt.Sprintf("%d %s %02d", year, month.String(), day)
		case byMonth:
			newDataPoint.Month = entries[i].Date.Month()
			newDataPoint.Year = entries[i].Date.Year()
			newDataPoint.Key = fmt.Sprintf("%d %s", year, month.String())
		case byYear:
			newDataPoint.Year = entries[i].Date.Year()
			newDataPoint.Key = fmt.Sprintf("%d", year)
		}
		timeSeries = append(timeSeries, newDataPoint)
	}

	return c.JSON(http.StatusOK, durationTimeSeriesJSONResponse{
		Count:      count,
		TimeSeries: timeSeries,
		Group:      grouping,
	})
}
