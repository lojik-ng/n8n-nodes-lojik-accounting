#!/bin/bash

rm -rf dist
git add .
git commit -m "chore: update package version"
git push
git stash
npm version patch
git stash pop
npm run build
npm commit -m "chore: build and publish package"
git push
git push --tags
npm publish --access public
