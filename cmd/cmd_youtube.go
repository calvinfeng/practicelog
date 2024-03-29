package cmd

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"strings"

	practicelogstore "github.com/calvinfeng/practicelog/practicelog/store"
	"github.com/calvinfeng/practicelog/util"

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

	fmt.Println(os.Environ())

	var addr string
	switch viper.GetString("environment") {
	case "production":
		addr = elasticBeanstalkDatabaseURL()
	case "heroku":
		addr = herokuDatabaseURL()
	default:
		addr = localDatabaseURL()
	}

	switch args[0] {
	case "reload":
		return util.ConcatErrors(
			reloadDBWithPlaylist(addr, practiceRecordingPlaylistID, false),
			reloadDBWithPlaylist(addr, progressRecordingPlaylistID, true))
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

	count, err := store.BatchUpsertProgressSummaries(summaries...)
	if err != nil {
		return err
	}
	logrus.Infof("successfully inserted %d progress summaries", count)

	return nil
}

func reloadDBWithPlaylist(addr string, playlistID string, isProgressRecording bool) error {
	if os.Getenv("YOUTUBE_API_KEY") == "" {
		return errors.New("YouTube API key is empty")
	}

	logrus.Infof("starting YouTube API service with API key %s", os.Getenv("YOUTUBE_API_KEY"))
	srv := youtubeapi.New(youtubeapi.Config{
		APIKey: os.Getenv("YOUTUBE_API_KEY"),
	})

	pg, err := sqlx.Open("postgres", addr)
	if err != nil {
		return err
	}

	vlogstore := videologstore.New(pg)
	plogstore := practicelogstore.New(pg)

	logrus.Infof("fetching YouTube playlist %s", playlistID)
	items, err := srv.PlaylistItems(playlistID)
	if err != nil {
		return err
	}

	if len(items) == 0 {
		return fmt.Errorf("YouTube API has returned 0 items for practice recording playlist %s",
			playlistID)
	}

	videos := make([]*videolog.Entry, 0, len(items))
	for _, item := range items {
		if item.ContentDetails.Published.IsZero() {
			continue
		}

		video := &videolog.Entry{
			ID:                item.ContentDetails.VideoID,
			Published:         item.ContentDetails.Published,
			Title:             item.Snippet.Title,
			Description:       item.Snippet.Description,
			IsMonthlyProgress: isProgressRecording,
			Thumbnails:        item.Snippet.Thumbnails,
			Username:          defaultUsername,
		}

		if strings.Contains(item.Snippet.Title, "AR 9:16") {
			video.VideoOrientation = videolog.OrientationPortrait
		} else {
			video.VideoOrientation = videolog.OrientationLandscape
		}

		sum, err := plogstore.SumLogEntryDurationBefore(video.Published)
		if err != nil {
			return fmt.Errorf("failed to sum log entry duration: %w", err)
		}
		video.MinGuitarPractice = sum

		if isProgressRecording {
			logrus.Infof("Progress Recording[%04d] %s", item.Snippet.Position, item.ContentDetails.VideoID)
		} else {
			logrus.Infof("Practice Recording[%04d] %s", item.Snippet.Position, item.ContentDetails.VideoID)
		}
		videos = append(videos, video)
	}

	count, err := vlogstore.BatchUpsertVideoLogEntries(videos...)
	if err != nil {
		return err
	}
	logrus.Infof("successfully inserted %d video log entries", count)

	return nil
}
