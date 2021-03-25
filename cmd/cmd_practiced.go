package cmd

import (
	"errors"
	"fmt"
	"github.com/calvinfeng/practicelog/practicelog"
	practicelogstore "github.com/calvinfeng/practicelog/practicelog/store"
	"github.com/jmoiron/sqlx"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func practicedRuneE(_ *cobra.Command, args []string) error {
	if len(args) < 1 {
		return errors.New("please provide label names")
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

	pg, err := sqlx.Open("postgres", addr)
	if err != nil {
		return err
	}

	store := practicelogstore.New(pg)

	labels, err := store.SelectLogLabels()
	if err != nil {
		return err
	}

	var targetLabel *practicelog.Label
	for _, label := range labels {
		if label.Name == args[0] {
			targetLabel = label
		}
	}
	if targetLabel == nil {
		return fmt.Errorf("label %s is not found in data", args[0])
	}

	labelDurations, err := store.ListLogLabelDurations()
	if err != nil {
		return err
	}

	var targetLabelDur int32
	for _, labelDur := range labelDurations {
		if labelDur.ID == targetLabel.ID {
			targetLabelDur = labelDur.Duration
		}
	}

	totalDur, err := store.SumLogEntryDuration()
	if err != nil {
		return err
	}

	logrus.Infof("total logged hours: %d", totalDur)
	logrus.Infof("total practiced time for %s: %d hours and %d minutes", args[0], targetLabelDur/60, targetLabelDur%60)

	return nil
}
