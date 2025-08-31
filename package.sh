#!/bin/bash

npm run clean
npm run lint
npm version patch
npm test
rm -f tmp-*.sqlite* ignored.sqlite
npm run build
git push
git push --tags
npm publish --access public
