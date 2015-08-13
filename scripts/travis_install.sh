#!/bin/bash
npm install -g gulp
npm install -g typedoc
npm install
bower install

# install Karma test suite and modules
npm install karma
npm install karma-mocha
npm install karma-firefox-launcher
