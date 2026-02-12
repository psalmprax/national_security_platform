#!/bin/bash
# Docker Compose Reset Script
# Resolves stale container state and permission issues

set -e

echo "🛑 Stopping and removing containers..."
# Force remove containers by name pattern
docker ps -a --filter "name=national_security" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true
docker ps -a --filter "name=nsp-new" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true

echo "🔄 Removing networks..."
docker network ls --format "{{.Name}}" | grep "national_security" | xargs -r docker network rm 2>/dev/null || true

echo "🧹 Cleaning up orphaned containers..."
docker container prune -f 2>/dev/null || true

echo "🚀 Starting fresh containers..."
cd "$(dirname "$0")"
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d

echo "✅ Done! Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "national_security|nsp-new" || echo "No matching containers found"
