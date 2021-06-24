#!/usr/bin/env bash

# Export DISPLAY for displaying User interfaces
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2; exit;}'):0.0

# Automatically start dbus
sudo /etc/init.d/dbus start &> /dev/null

# Start cypress
cypress open