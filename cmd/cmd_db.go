package cmd

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"time"

	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/calvinfeng/practicelog/practicelog/logstore"
	"github.com/jmoiron/sqlx"
	"github.com/spf13/viper"

	"github.com/golang-migrate/migrate/v4"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"

	// Driver for PostgreSQL
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// Reset the database, apply migrationsV1 and then seed it.
func databaseRunE(_ *cobra.Command, args []string) error {
	if len(args) < 1 {
		return errors.New("provide an argument to manage database [reset, migrate, seed]")
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

	logrus.Infof("current environment is %s, apply changes to database on %s",
		viper.GetString("environment"), addr)

	switch args[0] {
	case "reset":
		return resetDB(addr)
	case "migrate":
		return migrateDB(addr)
	case "force":
		return forceMigrateDB(addr)
	case "seed":
		return seedDB(addr)
	case "dump":
		return dumpDB(addr)
	case "load":
		return loadDB(addr, args)
	default:
		return fmt.Errorf("%s is not a recognized command", args[0])
	}
}

func resetDB(addr string) error {
	m, err := migrate.New("file://./migrations", addr)
	if err != nil {
		return err
	}
	if err := m.Drop(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to drop migrations: %w", err)
	}
	if version, dirty, err := m.Version(); err != nil && err != migrate.ErrNilVersion {
		return err
	} else {
		logrus.Infof("successfully reset database to version %d, dirty=%v", version, dirty)
	}
	return nil
}

func forceMigrateDB(addr string) error {
	m, err := migrate.New("file://./migrations", addr)
	if err != nil {
		return err
	}
	if err := m.Force(1); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to apply migrations: %w", err)
	}
	if version, dirty, err := m.Version(); err != nil {
		return err
	} else {
		logrus.Infof("successfully migrated database to version %d, dirty=%v", version, dirty)
	}
	return nil
}

func migrateDB(addr string) error {
	m, err := migrate.New("file://./migrations", addr)
	if err != nil {
		return err
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to apply migrations: %w", err)
	}
	if version, dirty, err := m.Version(); err != nil {
		return err
	} else {
		logrus.Infof("successfully migrated database to version %d, dirty=%v", version, dirty)
	}
	return nil
}

func loadDB(addr string, args []string) error {
	if len(args) < 2 {
		return errors.New("not enough arguments provided to load DB")
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

func dumpDB(addr string) error {
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
