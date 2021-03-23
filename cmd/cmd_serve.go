package cmd

import (
	"context"
	"fmt"
	"net/http"

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
	"google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
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

	// e.File("/", "practicelogui/build/index.html")
	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Root:   "practicelogui/build/",
		Browse: true,
	}))

	if viper.GetBool("authentication.enabled") {
		oauthSrv, err := oauth2.NewService(context.Background(), option.WithHTTPClient(http.DefaultClient))
		if err != nil {
			return err
		}
		e.Use(auth.NewGoogleIDTokenValidateMiddleware(oauthSrv))
	}

	pg, err := sqlx.Open("postgres", addr)
	if err != nil {
		return err
	}

	logrus.Infof("connected to database on %s", addr)
	logapi := practicelogapi.New(practicelogstore.New(pg), viper.GetBool("authentication.enabled"))
	videoapi := videologapi.New(videologstore.New(pg), viper.GetBool("authentication.enabled"))

	// Authentication
	e.POST("/api/v1/token/validate", auth.TokenValidationHandler)

	// Labels
	e.GET("/api/v1/log/labels", logapi.ListPracticeLogLabels)
	e.POST("/api/v1/log/labels", logapi.CreatePracticeLogLabel)
	e.PUT("/api/v1/log/labels/:label_id", logapi.UpdatePracticeLogLabel)
	e.DELETE("/api/v1/log/labels/:label_id", logapi.DeletePracticeLogLabel)

	// Entries
	e.GET("/api/v1/log/entries", logapi.ListPracticeLogEntries)
	e.POST("/api/v1/log/entries", logapi.CreatePracticeLogEntry)
	e.PUT("/api/v1/log/entries/:entry_id", logapi.UpdatePracticeLogEntry)
	e.DELETE("/api/v1/log/entries/:entry_id", logapi.DeletePracticeLogEntry)

	// Assignments
	e.PUT("/api/v1/log/entries/:entry_id/assignments", logapi.UpdatePracticeLogAssignments)

	// Videos
	e.GET("/api/v1/videolog/entries", videoapi.ListVideoLogEntries)
	e.GET("/api/v1/videolog/summaries", videoapi.ListProgressSummaries)

	// Duration data
	// - Fetch all labels' duration, each duration is a sum of log entries that share a common label association.
	// - Fetch the total sum of all durations, i.e. total hours of practice
	// - Fetch the total sum of all durations, but present them as time series
	e.GET("/api/v1/log/labels/duration", logapi.ListLogLabelDurations)
	e.GET("/api/v1/log/entries/duration", logapi.GetLogEntryDurationSum)
	e.GET("/api/v1/log/entries/duration/time-series", logapi.GetLogEntryDurationCumulativeSumTimeSeries)

	logrus.Infof("http server is listening on %s", viper.GetString("http.port"))
	return e.Start(fmt.Sprintf(":%s", viper.GetString("http.port")))
}
