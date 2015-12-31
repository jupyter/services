module.exports = function (config) {
  config.set({
    basePath: '..',
    frameworks: ['mocha'],
    reporters: ['mocha'],
    client: { mocha: { timeout: 30000 } },
    preprocessors: { 'test/src/karma.ts': ['webpack'] },
    files: ['test/src/karma.ts'],
    webpack: {
      resolve: {
        extensions: ['', '.ts', '.js']
      },
      module: {
        loaders: [
          { test: /\.ts$/, loader: 'ts-loader' },
          { test: /\.css$/, loader: 'style-loader!css-loader' },
        ]
      }
    },
    port: 9876,
    colors: true,
    singleRun: true,
    logLevel: config.LOG_INFO,
    browserNoActivityTimeout: 30000,
  });
};
