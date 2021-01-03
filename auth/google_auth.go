package auth

import (
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"
	"google.golang.org/api/oauth2/v2"
	"net/http"
)

func NewGoogleIDTokenValidateMiddlware(srv *oauth2.Service) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			token := c.Request().Header.Get("Authorization")
			if token == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "ID token is not provided")
			}

			tokenInfoCall := srv.Tokeninfo()
			tokenInfoCall.IdToken(token)
			tokenInfo, err := tokenInfoCall.Do()
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, fmt.Sprintf("provided token %s is invalid", token))
			}
			c.Set("token_info", tokenInfo)
			logrus.Infof("%s %s authenticated user: %s",
				c.Request().Method,
				c.Request().RequestURI, tokenInfo.Email)
			return next(c)
		}
	}
}
