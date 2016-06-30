var version = require('./package.json').version;

module.exports = {
    entry: './lib/index.js',
    output: {
        filename: 'jupyter-js-services.js',
        path: './dist',
        publicPath: 'https://npmcdn.com/jupyter-js-services@' + version + '/dist/'
    },
    devtool: 'source-map'
};
