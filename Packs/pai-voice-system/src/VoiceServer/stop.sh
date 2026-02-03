#!/bin/bash

# Stop the PAI Voice Server
# Detects OS and delegates to the appropriate service implementation

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

OS="$(uname -s)"

case "$OS" in
    Darwin)
        exec "$SCRIPT_DIR/macos-service/stop.sh"
        ;;
    Linux)
        exec "$SCRIPT_DIR/linux-service/stop.sh"
        ;;
    *)
        echo "Unsupported OS: $OS"
        exit 1
        ;;
esac
