package cmd

import (
	"errors"
	"fmt"
	"github.com/spf13/viper"

	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/calvinfeng/practicelog/practicelog/logstore"
	"github.com/jmoiron/sqlx"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

func practicedRuneE(_ *cobra.Command, args []string) error {
	if len(args) < 1 {
		return errors.New("please provide label names")
	}

	addr := localDBAddress()
	if viper.Get("environment") == "production" {
		addr = ebDBAddress()
	}

	pg, err := sqlx.Open("postgres", addr)
	if err != nil {
		return err
	}

	store := logstore.New(pg)

	labels, err := store.SelectLogLabels()
	if err != nil {
		return err
	}

	labelByName := make(map[string]*practicelog.Label)
	for _, label := range labels {
		labelByName[label.Name] = label
	}

	labelIDs := make([]string, 0)
	for _, name := range args {
		label, ok := labelByName[name]
		if !ok {
			return fmt.Errorf("label %s not found", name)
		}
		logrus.Infof("found label %s", label.Name)
		labelIDs = append(labelIDs, label.ID.String())
	}

	dur, err := store.SumDurationLogEntries(logstore.ByLabelIDList(labelIDs))
	if err != nil {
		return err
	}

	logrus.Infof("total practiced time for %s: %d hours and %d minutes", args[0], dur/60, dur%60)

	return nil
}
