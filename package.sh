#!/bin/bash

npm run clean
git stash
npm version patch
git stash pop
git commit
npm run build
git push
git push --tags
npm publish --access public
