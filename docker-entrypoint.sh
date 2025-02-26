#!/bin/sh
set -e

# Debug: List contents of build directory
echo "Checking frontend build directory..."
ls -la /app/src/frontend/build || echo "Build directory not found!"

# Start Syncthing
syncthing --home="${ST_HOME}" --no-browser --gui-address="0.0.0.0:8384" --no-restart --no-default-folder &

# Start the Node.js application
exec npm start