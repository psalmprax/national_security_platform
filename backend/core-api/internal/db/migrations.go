package db

import (
	"embed"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/cockroachdb"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed all:migrations/*.sql
var migrationFiles embed.FS

func RunMigrations() error {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return fmt.Errorf("DATABASE_URL environment variable is not set")
	}

	// Create a new source driver from the embedded filesystem
	d, err := iofs.New(migrationFiles, "migrations")
	if err != nil {
		return fmt.Errorf("unable to create iofs driver: %w", err)
	}

	// Replace scheme for migrate library (needs cockroachdb:// for better compatibility)
	if strings.HasPrefix(dbURL, "postgresql://") {
		dbURL = strings.Replace(dbURL, "postgresql://", "cockroachdb://", 1)
	} else if strings.HasPrefix(dbURL, "postgres://") {
		dbURL = strings.Replace(dbURL, "postgres://", "cockroachdb://", 1)
	}

	// Initialize the migrator
	m, err := migrate.NewWithSourceInstance("iofs", d, dbURL)
	if err != nil {
		return fmt.Errorf("unable to create migrator: %w", err)
	}
	defer m.Close()

	// Run up migrations
	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("unable to run migrations: %w", err)
	}

	version, dirty, err := m.Version()
	if err != nil && !errors.Is(err, migrate.ErrNilVersion) {
		return fmt.Errorf("unable to get migration version: %w", err)
	}

	if dirty {
		log.Printf("⚠️  Database is in a DIRTY state (version %d). Manual intervention may be required.", version)
	} else {
		log.Printf("✅ Database migrations complete. Current version: %d", version)
	}

	return nil
}
