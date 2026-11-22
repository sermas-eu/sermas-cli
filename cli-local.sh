#!/bin/sh
# Runs the CLI from its sources, from any directory: relative paths given to
# commands stay relative to the caller's directory.
DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_LEVEL="${LOG_LEVEL:-debug}" NODE_TLS_REJECT_UNAUTHORIZED=0 \
  TSX_TSCONFIG_PATH="$DIR/tsconfig.json" \
  exec "$DIR/node_modules/.bin/tsx" "$DIR/src/index.ts" "$@"
