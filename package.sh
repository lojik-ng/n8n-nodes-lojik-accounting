#!/bin/bash

npm run clean
git push
npm version patch
npm run build
git push
git push --tags
npm publish --access public
