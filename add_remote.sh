#!/bin/bash

# Check if a remote URL is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <git_remote_url>"
  exit 1
fi

REMOTE_URL=$1

# Add remote
git remote add origin "$REMOTE_URL"

# Verify remote
git remote -v

echo "Remote 'origin' added successfully. You can now push your changes:"
echo "git push -u origin main"
