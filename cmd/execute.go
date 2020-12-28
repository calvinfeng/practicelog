package cmd

import (
	"fmt"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func init() {
	logrus.SetFormatter(&logrus.TextFormatter{
		ForceColors:   true,
		FullTimestamp: true,
	})
}

var configName string

func initViper() {
	viper.AddConfigPath("./conf")
	viper.SetConfigName(configName)
	viper.SetConfigType("toml")

	try := func(err error) {
		if err != nil {
			logrus.Fatal(err)
		}
	}
	try(viper.BindEnv("ebdb.hostname", "RDS_HOSTNAME"))
	try(viper.BindEnv("ebdb.port", "RDS_PORT"))
	try(viper.BindEnv("ebdb.dbname", "RDS_DB_NAME"))
	try(viper.BindEnv("ebdb.username", "RDS_USERNAME"))
	try(viper.BindEnv("ebdb.password", "RDS_PASSWORD"))
	try(viper.BindEnv("ebdb.ssl_mode", "RDS_SSL_MODE"))

	if err := viper.ReadInConfig(); err != nil {
		logrus.Fatal(err)
	}

	logrus.Infof("configuration values are successfully loaded from %s", configName)
}

func localDBAddress() string {
	return fmt.Sprintf("postgresql://%s:%s@%s:%d/%s?sslmode=%s",
		viper.GetString("postgresql.username"),
		viper.GetString("postgresql.password"),
		viper.GetString("postgresql.hostname"),
		viper.GetInt("postgresql.port"),
		viper.GetString("postgresql.dbname"),
		viper.GetString("postgresql.ssl_mode"),
	)
}

func ebDBAddress() string {
	return fmt.Sprintf("postgresql://%s:%s@%s:%d/%s?sslmode=%s",
		viper.GetString("ebdb.username"),
		viper.GetString("ebdb.password"),
		viper.GetString("ebdb.hostname"),
		viper.GetInt("ebdb.port"),
		viper.GetString("ebdb.dbname"),
		viper.GetString("ebdb.ssl_mode"),
	)
}

func Execute() {
	cobra.OnInitialize(initViper)

	root := &cobra.Command{
		Use:   "practicelog",
		Short: "practice practicelog for developing guitar mastery",
	}

	root.PersistentFlags().
		StringVarP(&configName, "config", "c", "development", "config TOML file name")

	root.AddCommand(
		&cobra.Command{
			Use:   "serve",
			Short: "start HTTP server and serve HTTP requests",
			RunE:  serveRunE,
		},
		&cobra.Command{
			Use:   "db",
			Short: "manage database",
			RunE:  databaseRunE,
		},
		//&cobra.Command{
		//	Use:   "experiment",
		//	Short: "experiment some basic backend logic",
		//	RunE:  experimentRunE,
		//},
		&cobra.Command{
			Use:   "practiced",
			Short: "calculate the total time in minutes spent on a particular practicelog category",
			RunE:  practicedRuneE,
		},
	)

	if err := root.Execute(); err != nil {
		logrus.Fatal(fmt.Errorf("application server has run into critical error: %w", err))
	}
}
