#!/bin/bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <backup-file-date>"
  exit 1
fi

BACKUP_FILE="backup-$1.tar.gz"
BACKUP_DIR="$(pwd)/backups"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

if [ ! -f $BACKUP_PATH ]; then
  echo "Error: Backup file not found: $BACKUP_PATH"
  exit 1
fi

echo "Restoring from: $BACKUP_PATH"

docker stop api postgres redis

echo "Restoring database..."

MSYS_NO_PATHCONV=1 docker run --rm \
  -v "backend_db:/volume" \
  -v "$BACKUP_DIR:/backup" \
  busybox \
  sh -c "rm -rf /volume/* && tar xzf /backup/$BACKUP_FILE -C /volume --strip-components=2 backup/db/"

docker run --rm -v backend_db:/volume alpine chown -R 999:999 /volume

echo "Restoring redis..."

MSYS_NO_PATHCONV=1 docker run --rm \
  -v "redis_data:/volume" \
  -v "$BACKUP_DIR:/backup" \
  busybox \
  sh -c "rm -rf /volume/* && tar xzf /backup/$BACKUP_FILE -C /volume --strip-components=2 backup/redis/"

echo "Restoring uploads..."

MSYS_NO_PATHCONV=1 docker run --rm \
  -v "backend_uploads:/volume" \
  -v "$BACKUP_DIR:/backup" \
  busybox \
  sh -c "rm -rf /volume/* && tar xzf /backup/$BACKUP_FILE -C /volume --strip-components=2 backup/uploads/"

docker compose up -d

echo "Restore complete!"