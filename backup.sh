#!/bin/bash

set -e

VOLUMES=("backend_db" "backend_uploads")

DAILY_KEEP=14
WEEKLY_KEEP=12 
MONTHLY_KEEP=12 

TODAY=$(date +"%d-%m-%Y")
WEEK=$(date +"%Y-%V")
MONTH=$(date +"%Y-%m")

# Paths for local filesystem (Linux style, works with mkdir etc.)
LOCAL_ROOT=$(pwd)

# Paths for Docker (Windows style if on Git Bash, Linux otherwise)
if uname | grep -qi "mingw"; then
  DOCKER_ROOT=$(pwd -W | sed 's#\\#/#g')   # C:/Users/...
else
  DOCKER_ROOT=$LOCAL_ROOT
fi

BACKUP_ROOT="$LOCAL_ROOT/backups"
DAILY_DIR="$BACKUP_ROOT/daily/$TODAY"
WEEKLY_DIR="$BACKUP_ROOT/weekly/$WEEK"
MONTHLY_DIR="$BACKUP_ROOT/monthly/$MONTH"

backup_to_dir() {
  local LOCAL_DIR=$1
  local REL_DIR=${LOCAL_DIR#$LOCAL_ROOT/}
  local DOCKER_DIR="$DOCKER_ROOT/$REL_DIR"

  mkdir -p "$LOCAL_DIR"
  for VOLUME in "${VOLUMES[@]}"; do
    echo "Backing up volume $VOLUME to $LOCAL_DIR..."
    MSYS_NO_PATHCONV=1 docker run --rm \
      -v $VOLUME:/volume \
      -v "$DOCKER_DIR:/backup" \
      busybox \
      tar czvf /backup/${VOLUME}.tar.gz -C /volume .
  done
}

prune_old_backups() {
  local DIR=$1
  local KEEP=$2
  if [ -d "$DIR" ]; then
    find "$DIR" -mindepth 1 -maxdepth 1 -type d \
      | sort -r \
      | tail -n +$((KEEP+1)) \
      | xargs -r rm -rf
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
