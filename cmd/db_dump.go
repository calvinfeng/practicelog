package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/calvinfeng/practicelog/practicelog/logstore"
	"github.com/jmoiron/sqlx"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"io/ioutil"
	"time"
)

func dumpDB() error {
	addr := localDBAddress()
	if viper.Get("environment") == "production" {
		addr = ebDBAddress()
	}

	pg, err := sqlx.Open("postgres", addr)
	if err != nil {
		return err
	}

	store := logstore.New(pg)
	if err := dumpLabels(store); err != nil {
		return err
	}
	return nil
}

type JSONDump struct {
	Labels []*practicelog.Label `json:"labels"`
	Entries []*practicelog.Entry `json:"entries"`
}

func dumpLabels(store practicelog.Store) error {
	now := time.Now()

	labels, err := store.SelectLogLabels()
	if err != nil {
		return err
	}

	count, err := store.CountLogEntries()
	if err != nil {
		return err
	}

	logrus.Infof("dumping %d log labels and %d log entries into JSON file", len(labels), count)

	entries, err := store.SelectLogEntries(uint64(count), 0)
	if err != nil {
		return err
	}

	file, _ := json.MarshalIndent(JSONDump{
		Labels: labels,
		Entries: entries,
	}, "", " ")

	 return ioutil.WriteFile(
		fmt.Sprintf("%04d-%02d-%02d-labels.json", now.Year(), now.Month(), now.Day()),
		file, 0644)
}