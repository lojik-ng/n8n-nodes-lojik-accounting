#!/bin/bash

npm run clean
git stash
npm version patch
git stash pop
npm run build
git push
git push --tags
npm publish --access public
