package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

var (
	Pool          *pgxpool.Pool
	RedisClient   *redis.Client
	RedisDisabled bool
)

// InitRedis initializes the Redis client with resilience
func InitRedis() error {
	redisAddr := os.Getenv("REDIS_URL")
	if redisAddr == "" {
		redisAddr = "redis:6379"
	}

	RedisClient = redis.NewClient(&redis.Options{
		Addr:            redisAddr,
		MaxRetries:      2,
		MinIdleConns:    5,
		ConnMaxIdleTime: 5 * time.Minute,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := RedisClient.Ping(ctx).Err(); err != nil {
		RedisDisabled = true
		return fmt.Errorf("unable to ping redis (marking DISBLED): %w", err)
	}

	log.Println("✅ Redis connection established")
	return nil
}

// InitDB initializes the database connection pool
func InitDB() error {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return fmt.Errorf("DATABASE_URL environment variable is not set")
	}

	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return fmt.Errorf("unable to parse database URL: %w", err)
	}

	Pool, err = pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Test the connection
	if err := Pool.Ping(context.Background()); err != nil {
		return fmt.Errorf("unable to ping database: %w", err)
	}

	log.Println("✅ Database connection established")
	return nil
}

// Close closes the database connection pool
func Close() {
	if Pool != nil {
		Pool.Close()
	}
	if RedisClient != nil {
		RedisClient.Close()
	}
}
