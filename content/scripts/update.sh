#!/bin/sh
# update.sh - System update script

echo "Updating FreeBSD system..."

# Update the base system
echo "Fetching updates..."
freebsd-update fetch install

# Update packages
echo "Updating packages..."
pkg upgrade -y

# Clean package cache
echo "Cleaning cache..."
pkg clean -y
pkg autoremove -y

echo "Update complete!"
echo "Consider rebooting if kernel was updated."
