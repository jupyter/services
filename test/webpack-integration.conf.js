var path = require('path');

module.exports = {
  entry: './test/build/integration.js',
  output: {
    filename: './test/build/integration_bundle.js'
  },
  bail: true,
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
    ],
  }
}
