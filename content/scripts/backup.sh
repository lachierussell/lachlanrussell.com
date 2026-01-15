#!/bin/sh
# backup.sh - Simple backup script

BACKUP_DIR="/var/backup"
DATE=$(date +%Y%m%d)
HOSTNAME=$(hostname -s)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup home directory
tar -czf $BACKUP_DIR/home-$HOSTNAME-$DATE.tar.gz /home

# Backup etc
tar -czf $BACKUP_DIR/etc-$HOSTNAME-$DATE.tar.gz /etc

echo "Backup completed: $DATE"
