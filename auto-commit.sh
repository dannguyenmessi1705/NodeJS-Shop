#!/bin/bash
cd /root/NodeJS-Shop/

git config --global user.email "didannguyen17@gmail.com"
git config --global user.name "dannguyenmessi1705"

# # Pull the latest changes from the remote repository
git pull origin main

# Add all changes
git add .

# Commit the changes with a timestamp
git commit -m "Auto commit on $(date +'%Y-%m-%d %H:%M:%S')"

# Push the changes to the remote repository
git push origin main