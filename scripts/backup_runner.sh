#!/bin/bash
# scripts/backup_runner.sh

# Load crontab
crontab /scripts/crontab

# Start cron in foreground
echo "🚀 Backup Runner starting..."
cron -f
