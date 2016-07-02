var version = require('./package.json').version;

module.exports = {
    entry: './lib/index.js',
    output: {
        filename: 'index.js',
        path: './dist',
        library: 'jupyter-js-services',
        libraryTarget: 'umd',
        publicPath: 'https://npmcdn.com/jupyter-js-services@' + version + '/dist/'
    },
    devtool: 'source-map'
};
