#!/bin/bash
npm run clean
npm run build
npm test
npm test:coverage
npm test:integration
npm run docs
