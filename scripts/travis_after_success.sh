#!/bin/bash
if [[ $TRAVIS_PULL_REQUEST == false && $TRAVIS_BRANCH == "master" ]]
then
    echo "-- building docs --"
    npm run docs

    ( cd docs 
    git init
    git config user.email "travis@travis-ci.com"
    git config user.name "Travis Bot"

    git add .
    git commit -m "Deployed to GitHub Pages"
    git push --force --quiet "https://${GHTOKEN}@${GH_REF}" master:gh-pages 2>&1
    )
else
    echo "-- will only build docs from master --"
fi
