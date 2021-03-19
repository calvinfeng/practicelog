package cmd

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/calvinfeng/practicelog/util"
	"io/ioutil"
	"os"
	"strings"

	"github.com/calvinfeng/practicelog/videolog"
	videologstore "github.com/calvinfeng/practicelog/videolog/store"
	"github.com/calvinfeng/practicelog/youtubeapi"
	"github.com/jmoiron/sqlx"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

const practiceRecordingPlaylistID = "PLvb0sLP6w4rIq7kS4-D4zDcbFPNZOSUhW"
const progressRecordingPlaylistID = "PLvb0sLP6w4rL8s3iDlfdOdA3_X2QNmMoB"
const defaultUsername = "calvin.j.feng@gmail.com"

func youtubeRuneE(_ *cobra.Command, args []string) error {
	if len(args) < 1 {
		return errors.New("provide an argument to YouTube utility command [reload]")
	}

	var addr string
	switch viper.GetString("environment") {
	case "production":
		addr = elasticBeanstalkDatabaseURL()
	case "heroku":
		addr = herokuDatabaseURL()
	default:
		addr = localDatabaseURL()
	}

	logrus.Infof("starting YouTube API service with API key %s", os.Getenv("YOUTUBE_API_KEY"))
	srv := youtubeapi.New(youtubeapi.Config{
		APIKey: os.Getenv("YOUTUBE_API_KEY"),
	})

	switch args[0] {
	case "reload":
		return util.ConcatErrors(reloadDBWithYouTubePlaylistItems(srv, addr), reloadDBWithProgressSummary(addr))
	default:
		return fmt.Errorf("%s is not a recognized command", args[0])
	}
}

func reloadDBWithProgressSummary(addr string) error {
	pg, err := sqlx.Open("postgres", addr)
	if err != nil {
		return err
	}

	store := videologstore.New(pg)

	var summaries []*videolog.ProgressSummary
	byteData, _ := ioutil.ReadFile("./migrations/resources/progress_summaries.json")
	if err := json.Unmarshal(byteData, &summaries); err != nil {
		return err
	}

	for i := range summaries {
		summaries[i].Username = defaultUsername
	}

	count, err := store.BatchInsertProgressSummaries(summaries...)
	if err != nil {
		return err
	}
	logrus.Infof("successfully inserted %d progress summaries", count)

	return nil
}

func reloadDBWithYouTubePlaylistItems(srv youtubeapi.Service, addr string) error {
	pg, err := sqlx.Open("postgres", addr)
	if err != nil {
		return err
	}

	store := videologstore.New(pg)

	logrus.Infof("fetching YouTube playlist practice recordings")
	items, err := srv.PlaylistItems(practiceRecordingPlaylistID)
	if err != nil {
		return err
	}

	if len(items) == 0 {
		return fmt.Errorf("YouTube API has returned 0 items for practice recording playlist %s",
			practiceRecordingPlaylistID)
	}

	entries := make([]*videolog.Entry, len(items))
	for i, item := range items {
		entries[i] = &videolog.Entry{
			ID:                item.ContentDetails.VideoID,
			Published:         item.ContentDetails.Published,
			Title:             item.Snippet.Title,
			Description:       item.Snippet.Description,
			IsMonthlyProgress: false,
			Thumbnails:        item.Snippet.Thumbnails,
			Username:          defaultUsername,
		}

		if strings.Contains(item.Snippet.Title, "AR 9:16") {
			entries[i].VideoOrientation = videolog.OrientationPortrait
		} else {
			entries[i].VideoOrientation = videolog.OrientationLandscape
		}

		logrus.Infof("Video[%04d] %s", item.Snippet.Position, item.ContentDetails.VideoID)
		fmt.Println(entries[i])
	}

	count, err := store.BatchUpsertVideoLogEntries(entries...)
	if err != nil {
		return err
	}
	logrus.Infof("successfully inserted %d video log entries", count)

	return nil
}
