#!/bin/bash

PROJECT_ROOT=$(pwd)
VOLUMES=("backend_db" "backend_uploads")

DAILY_KEEP=14
WEEKLY_KEEP=12 
MONTHLY_KEEP=12 

TODAY=$(date +"%d-%m-%Y")
WEEK=$(date +"%Y-%V")
MONTH=$(date +"%Y-%m")

BACKUP_ROOT="$PROJECT_ROOT/backups"
DAILY_DIR="$BACKUP_ROOT/daily/$TODAY"
WEEKLY_DIR="$BACKUP_ROOT/weekly/$WEEK"
MONTHLY_DIR="$BACKUP_ROOT/monthly/$MONTH"

backup_to_dir() {
  local DIR=$1
  mkdir -p "$DIR"
  for VOLUME in "${VOLUMES[@]}"; do
    echo "Backing up volume $VOLUME to $DIR..."
    docker run --rm \
      -v $VOLUME:/volume \
      -v $DIR:/backup \
      busybox \
      tar czvf /backup/${VOLUME}.tar.gz -C /volume .
  done
}

prune_old_backups() {
  local DIR=$1
  local KEEP=$2
  if [ -d "$DIR" ]; then
    ls -1dt "$DIR"/* | tail -n +$((KEEP+1)) | xargs -r rm -rf
  fi
}

backup_to_dir "$DAILY_DIR"

if [ "$(date +%u)" -eq 7 ]; then
  backup_to_dir "$WEEKLY_DIR"
fi

if [ "$(date +%d)" -eq 01 ]; then
  backup_to_dir "$MONTHLY_DIR"
fi

prune_old_backups "$BACKUP_ROOT/daily" $DAILY_KEEP
prune_old_backups "$BACKUP_ROOT/weekly" $WEEKLY_KEEP
prune_old_backups "$BACKUP_ROOT/monthly" $MONTHLY_KEEP

echo "All backups completed!"
