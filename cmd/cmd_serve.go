package cmd

import (
	"context"
	"fmt"
	"github.com/calvinfeng/practicelog/youtubeapi"
	"google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
	"net/http"
	"os"

	"github.com/calvinfeng/practicelog/auth"
	practicelogapi "github.com/calvinfeng/practicelog/practicelog/restapi"
	practicelogstore "github.com/calvinfeng/practicelog/practicelog/store"
	videologapi "github.com/calvinfeng/practicelog/videolog/restapi"
	videologstore "github.com/calvinfeng/practicelog/videolog/store"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func serveRunE(_ *cobra.Command, _ []string) error {
	var addr string
	switch viper.GetString("environment") {
	case "production":
		addr = elasticBeanstalkDatabaseURL()
	case "heroku":
		addr = herokuDatabaseURL()
	default:
		addr = localDatabaseURL()
	}

	e := echo.New()
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{http.MethodGet, http.MethodPut, http.MethodPost, http.MethodDelete},
	}))

	e.File("/", "practicelogui/build/index.html")
	e.File("/fretboard", "practicelogui/build/index.html")
	e.File("/timeline", "practicelogui/build/index.html")
	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Root:   "practicelogui/build/",
		Browse: true,
	}))

	pg, err := sqlx.Open("postgres", addr)
	if err != nil {
		return err
	}

	logrus.Infof("connected to database on %s", addr)
	logapi := practicelogapi.New(practicelogstore.New(pg))
	videoapi := videologapi.New(
		videologstore.New(pg),
		practicelogstore.New(pg),
		youtubeapi.New(youtubeapi.Config{
			APIKey: os.Getenv("YOUTUBE_API_KEY"),
		}),
		viper.GetBool("authentication.enabled"),
	)

	apiV1 := e.Group("/api/v1")

	oauthSrv, err := oauth2.NewService(context.Background(), option.WithHTTPClient(http.DefaultClient))
	if err != nil {
		return err
	}
	apiV1.Use(auth.NewGoogleIDTokenValidateMiddleware(oauthSrv, viper.GetBool("authentication.enabled")))

	// Authentication
	apiV1.POST("/token/validate", auth.TokenValidationHandler)

	// Labels
	apiV1.GET("/log/labels", logapi.ListPracticeLogLabels)
	apiV1.POST("/log/labels", logapi.CreatePracticeLogLabel)
	apiV1.PUT("/log/labels/:label_id", logapi.UpdatePracticeLogLabel)
	apiV1.DELETE("/log/labels/:label_id", logapi.DeletePracticeLogLabel)

	// Entries
	apiV1.GET("/log/entries", logapi.ListPracticeLogEntries)
	apiV1.POST("/log/entries", logapi.CreatePracticeLogEntry)
	apiV1.PUT("/log/entries/:entry_id", logapi.UpdatePracticeLogEntry)
	apiV1.DELETE("/log/entries/:entry_id", logapi.DeletePracticeLogEntry)

	// Assignments
	apiV1.PUT("/log/entries/:entry_id/assignments", logapi.UpdatePracticeLogAssignments)

	// Duration data
	// - Fetch all labels' duration, each duration is a sum of log entries that share a common label association.
	// - Fetch the total sum of all durations, i.e. total hours of practice
	// - Fetch the total sum of all durations, but present them as time series
	apiV1.GET("/log/labels/duration", logapi.ListLogLabelDurations)
	apiV1.GET("/log/entries/duration", logapi.GetLogEntryDurationSum)
	apiV1.GET("/log/entries/duration/time-series", logapi.GetLogEntryDurationCumulativeSumTimeSeries)

	apiV1.POST("/videolog/entries/reload", videoapi.LoadFromYouTubePlaylist)

	publicAPI := e.Group("/public/api/v1")
	// Videos
	publicAPI.GET("/videolog/entries", videoapi.ListVideoLogEntries)
	publicAPI.GET("/videolog/summaries", videoapi.ListProgressSummaries)

	logrus.Infof("http server is listening on %s", viper.GetString("http.port"))
	return e.Start(fmt.Sprintf(":%s", viper.GetString("http.port")))
}
