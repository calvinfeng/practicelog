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
	grouping := group(c.QueryParam("group"))
	if grouping != byDay && grouping != byMonth && grouping != byYear {
		return echo.NewHTTPError(http.StatusBadRequest,
			fmt.Sprintf("query parameter is required ?group=[by_day, by_month, by_year]"))
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

	timeSeries := generateTimeSeries(entries, grouping, false)

	return c.JSON(http.StatusOK, durationTimeSeriesJSONResponse{
		Count:      count,
		TimeSeries: timeSeries,
		Group:      grouping,
	})
}

func (s *server) GetLogEntryDurationCumulativeSumTimeSeries(c echo.Context) error {
	grouping := group(c.QueryParam("group"))
	if grouping != byDay && grouping != byMonth && grouping != byYear {
		return echo.NewHTTPError(http.StatusBadRequest,
			fmt.Sprintf("query parameter is required ?group=[by_day, by_month, by_year]"))
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

	// Convert minutes to hours for this particular API
	timeSeries := generateTimeSeries(entries, grouping, true)
	for i := range timeSeries {
		timeSeries[i].Value /= 60
	}

	return c.JSON(http.StatusOK, durationTimeSeriesJSONResponse{
		Count:      count,
		TimeSeries: timeSeries,
		Group:      grouping,
	})
}

func inSameGroup(prev timeSeriesDataPoint, curr *practicelog.Entry, grouping group) bool {
	switch grouping {
	case byDay:
		return prev.Year == curr.Date.Year() && prev.Month == curr.Date.Month() && prev.Day == curr.Date.Day()
	case byMonth:
		return prev.Year == curr.Date.Year() && prev.Month == curr.Date.Month()
	case byYear:
		return prev.Year == curr.Date.Year()
	default:
		panic("grouping strategy must be one of [by day, by month, by year]")
	}
}

func generateTimeSeries(entries []*practicelog.Entry, grouping group, cumulative bool) []timeSeriesDataPoint {
	timeSeries := make([]timeSeriesDataPoint, 0)

	var accum int32
	// Entries are in descending order by date.
	for i := len(entries) - 1; i >= 0; i-- {
		accum += entries[i].Duration

		if len(timeSeries) > 0 && inSameGroup(timeSeries[len(timeSeries)-1], entries[i], grouping) {
			timeSeries[len(timeSeries)-1].Value += float32(entries[i].Duration)
			continue
		}

		year, month, day := entries[i].Date.Date()

		var newDataPoint timeSeriesDataPoint
		if cumulative {
			newDataPoint = timeSeriesDataPoint{Value: float32(accum)}
		} else {
			newDataPoint = timeSeriesDataPoint{Value: float32(entries[i].Duration)}
		}

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
	return timeSeries
}
