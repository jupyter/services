module.exports = function (config) {
  config.set({
    frameworks: ['browserify', 'mocha'],
    reporters: ['mocha'],
    preprocessors: { 'build/karma.js': ['browserify'] },
    browserify: { debug: true },
    files: ['build/karma.js'],
    colors: true,
    singleRun: true,
    logLevel: config.LOG_INFO
  });
};
