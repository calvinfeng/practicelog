package cmd

import (
	"errors"
	"fmt"
	"github.com/spf13/viper"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

// Reset the database, apply migrationsV1 and then seed it.
func databaseRunE(_ *cobra.Command, args []string) error {
	if len(args) < 1 {
		return errors.New("provide an argument to manage database [reset, migrate, seed]")
	}

	addr := localDBAddress()
	if viper.Get("environment") == "production" {
		addr = ebDBAddress()
	}

	logrus.Infof("applying changes to database on %s", addr)

	switch args[0] {
	case "reset":
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
	case "migrate":
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
	case "seed":
		return seedDB()
	case "dump":
		return dumpDB()
	case "load":
		return loadDB(args)
	default:
		return fmt.Errorf("%s is not a recognized command", args[0])
	}
}
