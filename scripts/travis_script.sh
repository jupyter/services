#!/bin/bash
set -e
gulp
gulp tests
./node_modules/.bin/karma start tests/karma.conf.js
