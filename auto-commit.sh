#!/bin/bash

cd /root/NodeJS-Shop/

# Pull the latest changes from the remote repository
git pull origin master

# Add all changes
git add .

# Commit the changes with a timestamp
git commit -m "Auto commit on $(date +'%Y-%m-%d %H:%M:%S')"

# Push the changes to the remote repository
git push origin master