package auth

import (
	"encoding/json"
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"google.golang.org/api/oauth2/v2"
	"io/ioutil"
	"net/http"
)

var emailWhiteList = map[string]struct{}{
	"calvin.j.feng@gmail.com": {},
}

type AccessTokenPayload struct {
	AccessToken string `json:"access_token"`
}

type GoogleUserInfoResponse struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	FamilyName    string `json:"family_name"`
	GivenName     string `json:"given_name"`
	Name          string `json:"name"`
	Locale        string `json:"locale"`
	Picture       string `json:"picture"`
	VerifiedEmail bool   `json:"verified_email"`
}

type TokenValidationResponse struct {
	GrantedScopes string `json:"granted_scopes"`
	GoogleUserInfoResponse
}

func TokenValidationHandler(c echo.Context) error {
	info, ok := c.Get("token_info").(*oauth2.Tokeninfo)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized,
			"token information is not found in HTTP context, perhaps middleware failed to inject it")
	}

	payload := new(AccessTokenPayload)
	if err := c.Bind(payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "failed to parse JSON data").Error())
	}

	resp, err := http.Get(
		fmt.Sprintf("https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=%s", payload.AccessToken))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "unable to fetch user information from Google API").Error())
	}
	defer resp.Body.Close()

	bodyBytes, err := ioutil.ReadAll(resp.Body)

	userInfoResp := GoogleUserInfoResponse{}
	if err := json.Unmarshal(bodyBytes, &userInfoResp); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest,
			errors.Wrap(err, "unable to unmarshal user information from Google API response").Error())
	}

	return c.JSON(http.StatusOK, TokenValidationResponse{
		GrantedScopes:          info.Scope,
		GoogleUserInfoResponse: userInfoResp,
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
