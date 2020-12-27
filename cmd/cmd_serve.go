package cmd

import (
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"net/http"
)

func serveRunE(_ *cobra.Command, _ []string) error {
	e := echo.New()
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{http.MethodGet, http.MethodPut, http.MethodPost, http.MethodDelete},
	}))

	e.File("/", "practicelogui/build/index.html")

	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Root:   "practicelogui/build/",
		Browse: true,
	}))

	logrus.Infof("http server is listening on 8080")
	return e.Start(":8080")
}
