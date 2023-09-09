#!/bin/bash

cd /root/NodeJS-Shop/

# Check for changes in the remote repository
if git pull origin master; then
    # Add all changes
    git add .

    # Commit the changes with a timestamp
    git commit -m "Nguyen Di Dan commit on $(date +'%Y-%m-%d %H:%M:%S')"

    # Push the changes to the remote repository
    git push origin master
else
    echo "No changes to pull."
fi