#!/bin/bash
# Load crontab
crontab /app/scripts/crontab

# Start cron in foreground
echo "🚀 Backup Runner starting..."
echo "📅 Scheduled tasks:"
crontab -l
cron -f
