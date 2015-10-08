module.exports = function (config) {
  config.set({
    frameworks: ['browserify', 'mocha'],
    reporters: ['mocha'],
    preprocessors: { 'build/karma.js': ['browserify'] },
    browserify: { debug: true },
    client: { mocha: { timeout: 60000 } },
    files: ['build/karma.js'],
    colors: true,
    singleRun: true,
    logLevel: config.LOG_INFO,
    browserNoActivityTimeout: 60000,
  });
};
