package cmd

import (
	"errors"
	"fmt"
	"github.com/calvinfeng/practicelog/videolog"
	"github.com/calvinfeng/practicelog/youtubeapi"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"os"
	"strings"
)

const practiceRecordingPlaylistID = "PLvb0sLP6w4rIq7kS4-D4zDcbFPNZOSUhW"
const progressRecordingPlaylistID = "PLvb0sLP6w4rL8s3iDlfdOdA3_X2QNmMoB"

func youtubeRuneE(_ *cobra.Command, args []string) error {
	if len(args) < 1 {
		return errors.New("provide an argument to YouTube utility command [test, load]")
	}

	logrus.Infof("starting YouTube API service with API key %s", os.Getenv("YOUTUBE_API_KEY"))
	srv := youtubeapi.New(youtubeapi.Config{
		APIKey: os.Getenv("YOUTUBE_API_KEY"),
	})

	switch args[0] {
	case "test":
		return loadPlaylistItems(srv)
	default:
		return fmt.Errorf("%s is not a recognized command", args[0])
	}
}

func loadPlaylistItems(srv youtubeapi.Service) error {
	logrus.Infof("fetching YouTube playlist practice recordings")
	items, err := srv.PlaylistItems(practiceRecordingPlaylistID)
	if err != nil {
		return err
	}

	if len(items) == 0 {
		return fmt.Errorf("YouTube API has returned 0 items for practice recording playlist %s",
			practiceRecordingPlaylistID)
	}

	for _, item := range items {
		logrus.Infof("Video[%04d] %s", item.Snippet.Position, item.ContentDetails.VideoID)
		fmt.Printf("Published YY-MM-DD %04d-%02d-%02d\n",
			item.ContentDetails.Published.Year(),
			item.ContentDetails.Published.Month(),
			item.ContentDetails.Published.Day())
		fmt.Printf("%s\n", item.Snippet.Title)
		fmt.Printf("%s\n", item.Snippet.Description)
		if strings.Contains(item.Snippet.Title, "AR 9:16") {
			fmt.Printf("Orientation: %s\n", videolog.OrientationPortrait)
		} else {
			fmt.Printf("Orientation: %s\n", videolog.OrientationLandscape)
		}
		for key, thumbnail := range item.Snippet.Thumbnails {
			fmt.Printf("%s %s %dx%d\n", key, thumbnail.URL, thumbnail.Width, thumbnail.Height)
		}
	}
	return nil
}
