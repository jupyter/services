#!/bin/bash
set -ex
export DISPLAY=:99.0
sh -e /etc/init.d/xvfb start || true

npm run clean
npm run build
npm run build:examples
npm test || npm test || npm test
npm run test:coverage || npm run test:coverage || npm run test:coverage
export PATH="$HOME/miniconda/bin:$PATH"
npm run test:integration || npm run test:integration || npm run test:integration

pushd examples/node
python main.py 
popd

npm run docs
