module.exports = function (config) {
  config.set({
    frameworks: ['browserify', 'mocha'],
    reporters: ['mocha'],
    preprocessors: { 'build/karma.js': ['browserify'] },
    client: { mocha: { timeout: 5000 } },
    browserify: { debug: true },
    client: { mocha: { timeout: 10000 } },
    files: ['build/karma.js'],
    colors: true,
    singleRun: true,
    logLevel: config.LOG_INFO
  });
};
