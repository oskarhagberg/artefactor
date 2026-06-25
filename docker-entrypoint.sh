#!/bin/sh
set -e

# Apply migrations on boot so a fresh /data volume self-initializes, then serve.
node dist/server/migrate.js
exec node dist/server/index.js
