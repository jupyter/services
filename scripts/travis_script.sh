#!/bin/bash
npm run clean
npm run build
npm test
npm run test:coverage
npm run test:integration
npm run docs
