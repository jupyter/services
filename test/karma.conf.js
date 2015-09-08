module.exports = function (config) {
  config.set({
    frameworks: ['browserify', 'mocha'],
    reporters: ['mocha'],
    preprocessors: { 'build/karma.js': ['browserify'] },
    browserify: { debug: true },
    files: ['build/karma.js'],
    port: 9876,
    colors: true,
    singleRun: true,
    logLevel: config.LOG_INFO
  });
};
