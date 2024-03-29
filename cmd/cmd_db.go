package cmd

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"strconv"
	"time"

	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/calvinfeng/practicelog/practicelog/store"
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
		return errors.New("provide an argument to manage database [reset, migrate, dump, load]")
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
		return migrateDB(addr, args)
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
	version, dirty, err := m.Version()
	if err != nil && err != migrate.ErrNilVersion {
		return err
	}

	logrus.Infof("successfully reset database to version %d, dirty=%v", version, dirty)
	return nil
}

func migrateDB(addr string, args []string) error {
	logrus.Infof("migration command received arguments %v", args)
	m, err := migrate.New("file://./migrations", addr)
	if err != nil {
		return err
	}

	switch {
	case len(args) >= 2:
		version, err := strconv.ParseInt(args[1], 10, 64)
		if err != nil {
			return fmt.Errorf("version has to be integer: %w", err)
		}
		if err := m.Migrate(uint(version)); err != nil && err != migrate.ErrNoChange {
			return fmt.Errorf("failed to apply migrations: %w", err)
		}
	default:
		logrus.Info("database is migrating to latest version")
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			return fmt.Errorf("failed to apply migrations: %w", err)
		}
	}

	version, dirty, err := m.Version()
	if err != nil {
		return err
	}

	logrus.Infof("successfully migrated database to version %d, dirty=%v", version, dirty)
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

	store := store.New(pg)

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

	count, err := store.BatchInsertLogLabels(dump.Labels...)
	if err != nil {
		return err
	}
	logrus.Infof("%d log labels have been inserted to DB", count)

	count, err = store.BatchInsertLogEntries(dump.Entries...)
	if err != nil {
		return err
	}

	logrus.Infof("%d log labels have been inserted to DB", count)
	return nil
}

// JSONDump is the format for the dump file.
type JSONDump struct {
	Labels  []*practicelog.Label `json:"labels"`
	Entries []*practicelog.Entry `json:"entries"`
}

func dumpDB(addr string) error {
	pg, err := sqlx.Open("postgres", addr)
	if err != nil {
		return err
	}

	store := store.New(pg)

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
