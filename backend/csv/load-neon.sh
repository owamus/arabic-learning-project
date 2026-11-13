#!/bin/sh
# Loads the schema, sentences and glosses into your DEPLOYED Neon database.
# Your local database is never touched. The Neon URL is read from ../../.env.local (written by `neon init`).
# Usage (from backend/csv):  sh load-neon.sh
set -e
cd "$(dirname "$0")"

URL=$(grep '^DATABASE_URL_UNPOOLED=' ../../.env.local | cut -d= -f2- | sed 's/^"//;s/"$//')
if [ -z "$URL" ]; then
  echo "DATABASE_URL_UNPOOLED not found in ../../.env.local" >&2
  exit 1
fi

echo "Creating tables on Neon..."
psql "$URL" -v ON_ERROR_STOP=1 -q -f schema.sql
echo "Loading sentences..."
DATABASE_URL="$URL" node load.js
echo "Loading glosses..."
DATABASE_URL="$URL" node load_glosses.js
echo "Done. Sentences now on Neon:"
psql "$URL" -t -c "SELECT count(*) FROM sentences;"
