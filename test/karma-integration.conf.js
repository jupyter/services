module.exports = function (config) {
  config.set({
    basePath: '..',
    frameworks: ['mocha'],
    reporters: ['mocha'],
    files: ['test/build/integration_bundle.js'],
    client: {
      mocha: {
        timeout: 10000,
      },
    },
    port: 9876,
    colors: true,
    singleRun: true,
    logLevel: config.LOG_INFO
  });
};
