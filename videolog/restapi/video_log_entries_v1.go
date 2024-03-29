package restapi

import (
	"fmt"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/labstack/echo/v4"
	"net/http"
)

func (api *apiV1) ListVideoLogEntries(c echo.Context) error {
	var err error
	var videos []*videolog.Entry
	videos, err = api.videoLogStore.SelectVideoLogEntries()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError,
			fmt.Errorf("server failed to query database %w", err).Error())
	}

	groups := make([]videoGroup, 0)
	for _, video := range videos {
		lastIndex := len(groups) - 1
		if lastIndex < 0 ||
			(groups[lastIndex].Year != video.Published.Year() || groups[lastIndex].Month != video.Published.Month()) {
			newGroup := videoGroup{
				Year:               video.Published.Year(),
				Month:              video.Published.Month(),
				PracticeRecordings: make([]*videolog.Entry, 0),
				ProgressRecordings: make([]*videolog.Entry, 0),
			}
			if video.IsMonthlyProgress {
				newGroup.ProgressRecordings = append(newGroup.ProgressRecordings, video)
			} else {
				newGroup.PracticeRecordings = append(newGroup.PracticeRecordings, video)
			}
			groups = append(groups, newGroup)
			continue
		}

		if video.IsMonthlyProgress {
			groups[lastIndex].ProgressRecordings = append(groups[lastIndex].ProgressRecordings, video)
		} else {
			groups[lastIndex].PracticeRecordings = append(groups[lastIndex].PracticeRecordings, video)
		}
	}

	return c.JSON(http.StatusOK, groups)
}
