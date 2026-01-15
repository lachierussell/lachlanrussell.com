#!/bin/sh
# update.sh - System update script

echo "Updating OpenBSD system..."

# Update packages
echo "Updating packages..."
pkg_add -u

# Update firmware (if needed)
echo "Checking firmware..."
fw_update

# Clean package cache
echo "Cleaning cache..."
pkg_delete -a

echo "Update complete!"
echo "Consider rebooting if kernel was updated."
