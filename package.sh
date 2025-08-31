#!/bin/bash

npm run clean
npm run lint
npm test
npm version patch
npm run build
git push
git push --tags
npm publish --access public