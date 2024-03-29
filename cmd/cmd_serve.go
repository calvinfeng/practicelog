package cmd

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/calvinfeng/practicelog/youtubeapi"
	"google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"

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
	logAPI := practicelogapi.New(practicelogstore.New(pg))
	videologAPI := videologapi.New(
		videologstore.New(pg),
		practicelogstore.New(pg),
		youtubeapi.New(youtubeapi.Config{
			APIKey: os.Getenv("YOUTUBE_API_KEY"),
		}),
		viper.GetBool("authentication.enabled"),
	)

	oauthSrv, err := oauth2.NewService(context.Background(), option.WithHTTPClient(http.DefaultClient))
	if err != nil {
		return err
	}

	/* V1
	============================================================================
	*/
	apiV1 := e.Group("/api/v1")
	apiV1.Use(auth.NewGoogleIDTokenValidateMiddleware(oauthSrv, viper.GetBool("authentication.enabled")))

	// Authentication
	apiV1.POST("/token/validate", auth.TokenValidationHandler)

	// Labels
	apiV1.GET("/log/labels", logAPI.ListPracticeLogLabels)
	apiV1.POST("/log/labels", logAPI.CreatePracticeLogLabel)
	apiV1.PUT("/log/labels/:label_id", logAPI.UpdatePracticeLogLabel)
	apiV1.DELETE("/log/labels/:label_id", logAPI.DeletePracticeLogLabel)

	// Entries
	apiV1.GET("/log/entries", logAPI.ListPracticeLogEntries)
	apiV1.POST("/log/entries", logAPI.CreatePracticeLogEntry)
	apiV1.PUT("/log/entries/:entry_id", logAPI.UpdatePracticeLogEntry)
	apiV1.DELETE("/log/entries/:entry_id", logAPI.DeletePracticeLogEntry)

	// Assignments
	apiV1.PUT("/log/entries/:entry_id/assignments", logAPI.UpdatePracticeLogAssignments)

	// Duration data
	// - Fetch all labels' duration, each duration is a sum of log entries that share a common label association.
	apiV1.GET("/log/labels/duration", logAPI.ListLogLabelDurations)
	// - Fetch the total sum of all durations, i.e. total hours of practice
	apiV1.GET("/log/entries/duration", logAPI.GetLogEntryDurationSum)
	// - Fetch a time series of practice duration with accumulation. This is ideal for graph.
	apiV1.GET("/log/entries/duration/accum-time-series", logAPI.GetLogEntryDurationCumulativeSumTimeSeries)
	// - Fetch a time series of practice duration group by some time interval. This is ideal for heat map.
	apiV1.GET("/log/entries/duration/time-series", logAPI.GetLogEntryDurationTimeSeries)

	/* Public
	============================================================================
	Deprecate the following API near future.
	*/
	publicAPI := e.Group("/public/api/v1")
	publicAPI.GET("/videolog/entries", videologAPI.V1().ListVideoLogEntries)
	publicAPI.GET("/videolog/summaries", videologAPI.V1().ListProgressSummaries)

	// Summaries
	apiV1.POST("/videolog/summaries", videologAPI.V1().UpsertProgressSummary)
	apiV1.PUT("/videolog/summaries/:summary_id", videologAPI.V1().UpsertProgressSummary)

	/* V2
	============================================================================
	For video log entry API, middleware should allow requests to pass even if
	token is not present. This allows people to share their profiles with each
	other.

	For now, everything requires a token in production mode.
	*/
	apiV2 := e.Group("/api/v2")
	apiV2.Use(auth.NewGoogleIDTokenValidateMiddleware(oauthSrv, viper.GetBool("authentication.enabled")))

	apiV2.GET("/videolog/profiles/mine", videologAPI.V2().GetMyVideoLogProfile)
	apiV2.POST("/videolog/profiles/mine", videologAPI.V2().UpsertMyVideoLogProfile)

	// Query params are ?profile=string in order to view a specific profile.
	apiV2.GET("/videolog/entries", videologAPI.V2().ListVideoLogEntries)
	apiV2.POST("/videolog/entries/reload", videologAPI.V2().LoadFromYouTubePlaylist)

	apiV2.GET("/videolog/summaries", videologAPI.V2().ListProgressSummaries)
	apiV2.POST("/videolog/summaries", videologAPI.V2().UpsertProgressSummary)

	logrus.Infof("http server is listening on %s", viper.GetString("http.port"))
	return e.Start(fmt.Sprintf(":%s", viper.GetString("http.port")))
}
