#!/bin/sh

if [ -z "$GITHUB_URL" ]; then
  echo "Define GITHUB_URL in .env file"
  exit 0
fi

origin_url=`git config --get remote.origin.url`

if [ "$origin_url" != "$GITHUB_URL" ]; then
  if [ -z "$(git remote | grep origin)" ]; then
    # create new remote origin
    git remote add origin $GITHUB_URL
  else
    # change existing remote origin
    git remote set-url origin $GITHUB_URL
  fi
fi

# checkout master
git checkout main

# fetch the newest code
git fetch origin main

# hard reset
git reset --hard origin/main

# force pull
git pull origin main --force

# refresh the editor
refresh
