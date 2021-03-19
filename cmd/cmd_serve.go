package cmd

import (
	"context"
	"fmt"
	"net/http"

	"github.com/calvinfeng/practicelog/auth"
	practicelogserver "github.com/calvinfeng/practicelog/practicelog/server"
	practicelogstore "github.com/calvinfeng/practicelog/practicelog/store"
	videologserver "github.com/calvinfeng/practicelog/videolog/server"
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
	pls := practicelogserver.New(practicelogstore.New(pg), viper.GetBool("authentication.enabled"))
	vls := videologserver.New(videologstore.New(pg), viper.GetBool("authentication.enabled"))

	// Authentication
	e.POST("/api/v1/token/validate", auth.TokenValidationHandler)

	// Labels
	e.GET("/api/v1/log/labels", pls.ListPracticeLogLabels)
	e.POST("/api/v1/log/labels", pls.CreatePracticeLogLabel)
	e.PUT("/api/v1/log/labels/:label_id", pls.UpdatePracticeLogLabel)
	e.DELETE("/api/v1/log/labels/:label_id", pls.DeletePracticeLogLabel)
	// Get duration by label specific
	e.GET("/api/v1/log/labels/duration", pls.ListLogLabelDurations)
	e.GET("/api/v1/log/labels/:label_id/duration", pls.GetLogLabelDuration)

	// Entries
	e.GET("/api/v1/log/entries", pls.ListPracticeLogEntries)
	e.POST("/api/v1/log/entries", pls.CreatePracticeLogEntry)
	e.PUT("/api/v1/log/entries/:entry_id", pls.UpdatePracticeLogEntry)
	e.DELETE("/api/v1/log/entries/:entry_id", pls.DeletePracticeLogEntry)
	// Get duration sum of all log entries
	e.GET("/api/v1/log/entries/duration", pls.GetLogEntryDurationSum)

	// Assignments
	e.PUT("/api/v1/log/entries/:entry_id/assignments", pls.UpdatePracticeLogAssignments)

	// Videos
	e.GET("/api/v1/videolog/entries", vls.ListVideoLogEntries)
	e.GET("/api/v1/videolog/summaries", vls.ListProgressSummaries)

	logrus.Infof("http server is listening on %s", viper.GetString("http.port"))
	return e.Start(fmt.Sprintf(":%s", viper.GetString("http.port")))
}
