#!/bin/sh
set -e

# Run the Node process as the unprivileged `node` user, not root. The container
# still *starts* as root so it can fix ownership of the mounted /data volume —
# including a volume first created back when the image ran as root — then drops
# privileges via gosu. /data holds the SQLite DB and the artefact payloads.
mkdir -p /data
chown -R node:node /data

# Apply migrations on boot so a fresh /data volume self-initializes, then serve.
gosu node node dist/server/migrate.js
exec gosu node node dist/server/index.js
