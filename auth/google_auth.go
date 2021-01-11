package auth

import (
	"errors"
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"
	"google.golang.org/api/oauth2/v2"
	"net/http"
)

var emailWhiteList = map[string]struct{}{
	"calvin.j.feng@gmail.com": {},
}

type TokenValidationResponse struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
}

func TokenValidationHandler(c echo.Context) error {
	info, ok := c.Get("token_info").(*oauth2.Tokeninfo)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized,
			"token information is not found in HTTP context, perhaps middleware failed to inject it")
	}

	if _, ok := emailWhiteList[info.Email]; !ok {
		return echo.NewHTTPError(http.StatusUnauthorized,
			fmt.Sprintf("%s is not an accepted user email, only Calvin is allowed to access this service", info.Email))
	}

	return c.JSON(http.StatusOK, TokenValidationResponse{
		UserID: info.UserId,
		Email:  info.Email,
	})
}

func GetEmailFromContext(c echo.Context) (string, error) {
	info, ok := c.Get("token_info").(*oauth2.Tokeninfo)
	if !ok {
		return "", errors.New("token information is not found in context")
	}
	return info.Email, nil
}

func formatLongToken(token string, maxLen int) string {
	tokenRunes := []rune(token)
	if len(tokenRunes) > maxLen {
		return fmt.Sprintf("%s...", string(tokenRunes[:maxLen]))
	}
	return token
}

func NewGoogleIDTokenValidateMiddleware(srv *oauth2.Service) echo.MiddlewareFunc {
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
				return echo.NewHTTPError(http.StatusUnauthorized,
					fmt.Sprintf("provided token %s is invalid", formatLongToken(token, 20)))
			}

			if _, ok := emailWhiteList[tokenInfo.Email]; !ok {
				return echo.NewHTTPError(http.StatusUnauthorized,
					fmt.Sprintf("%s is not an accepted user email, only Calvin is allowed to access this service",
						tokenInfo.Email))
			}

			c.Set("token_info", tokenInfo)
			logrus.Infof("%s %s authenticated user: %s",
				c.Request().Method,
				c.Request().RequestURI, tokenInfo.Email)
			return next(c)
		}
	}
}
