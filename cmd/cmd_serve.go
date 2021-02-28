package cmd

import (
	"context"
	"fmt"
	"github.com/calvinfeng/practicelog/auth"
	"github.com/calvinfeng/practicelog/practicelog/logserver"
	"github.com/calvinfeng/practicelog/practicelog/logstore"
	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
	"net/http"
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
	srv := logserver.New(logstore.New(pg), viper.GetBool("authentication.enabled"))

	// Authentication
	e.GET("/api/v1/token/validate", auth.TokenValidationHandler)

	// Labels
	e.GET("/api/v1/log/labels", srv.ListPracticeLogLabels)
	e.POST("/api/v1/log/labels", srv.CreatePracticeLogLabel)
	e.PUT("/api/v1/log/labels/:label_id", srv.UpdatePracticeLogLabel)
	e.DELETE("/api/v1/log/labels/:label_id", srv.DeletePracticeLogLabel)
	e.GET("/api/v1/log/labels/:label_id/duration", srv.GetLogLabelDurationSum)
	e.GET("/api/v1/log/labels/duration", srv.ListLogLabelDurations)

	// Entries
	e.GET("/api/v1/log/entries", srv.ListPracticeLogEntries)
	e.POST("/api/v1/log/entries", srv.CreatePracticeLogEntry)
	e.PUT("/api/v1/log/entries/:entry_id", srv.UpdatePracticeLogEntry)
	e.DELETE("/api/v1/log/entries/:entry_id", srv.DeletePracticeLogEntry)
	e.GET("/api/v1/log/entries/duration", srv.GetLogEntryDurationSum)

	// Assignments
	e.PUT("/api/v1/log/entries/:entry_id/assignments", srv.UpdatePracticeLogAssignments)

	logrus.Infof("http server is listening on %s", viper.GetString("http.port"))
	return e.Start(fmt.Sprintf(":%s", viper.GetString("http.port")))
}
