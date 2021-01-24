package cmd

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/calvinfeng/practicelog/practicelog/logstore"
	"github.com/jmoiron/sqlx"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"io/ioutil"
	"os"
	"time"
)

func loadDB(args []string) error {
	if len(args) < 2 {
		return errors.New("not enough arguments provided to load DB")
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

	jsonFile, err := os.Open(args[1])
	if err != nil {
		return fmt.Errorf("failed to open file %w", err)
	}
	defer jsonFile.Close()

	byteValue, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		return fmt.Errorf("failed to read bytes from file %w", err)
	}

	var dump JSONDump
	if err := json.Unmarshal(byteValue, &dump); err != nil {
		return err
	}
	logrus.Infof("loaded %d log labels and %d log entries from JSON file %s",
		len(dump.Labels), len(dump.Entries), args[1])

	if count, err := store.BatchInsertLogLabels(dump.Labels...); err != nil {
		return err
	} else {
		logrus.Infof("%d log labels have been inserted to DB", count)
	}

	if count, err := store.BatchInsertLogEntries(dump.Entries...); err != nil {
		return err
	} else {
		logrus.Infof("%d log labels have been inserted to DB", count)
	}
	return nil
}

type JSONDump struct {
	Labels  []*practicelog.Label `json:"labels"`
	Entries []*practicelog.Entry `json:"entries"`
}

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

	data, _ := json.MarshalIndent(JSONDump{
		Labels:  labels,
		Entries: entries,
	}, "", " ")

	env := viper.Get("environment")
	return ioutil.WriteFile(
		fmt.Sprintf("%04d-%02d-%02d-%s-backup.json", now.Year(), now.Month(), now.Day(), env),
		data, 0644)
}
