#!/bin/bash
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 <backup-file.tar.gz> <volume-name>"
  exit 1
fi

BACKUP_FILE=$1
VOLUME_NAME=$2

if [ ! -f "$BACKUP_FILE/$VOLUME_NAME.tar.gz" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE/$VOLUME_NAME.tar.gz"
  exit 1
fi

BACKUP_DIR=$(dirname "$BACKUP_FILE/$VOLUME_NAME.tar.gz")
BACKUP_NAME=$(basename "$BACKUP_FILE/$VOLUME_NAME.tar.gz")

echo "Restoring $BACKUP_FILE/$VOLUME_NAME.tar.gz into volume $VOLUME_NAME..."

MSYS_NO_PATHCONV=1  docker run --rm \
  -v "$VOLUME_NAME:/volume" \
  -v "$BACKUP_DIR:/backup" \
  busybox \
  sh -c "rm -rf /volume/* && tar xzvf /backup/$BACKUP_NAME -C /volume"

echo "Restore complete!"