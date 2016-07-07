var version = require('./package.json').version;

module.exports = {
    entry: './lib',
    output: {
        filename: './dist/index.js',
        library: ['jupyter', 'services'],
        libraryTarget: 'umd',
        publicPath: 'https://npmcdn.com/jupyter-js-services@' + version + '/dist/'
    },
    devtool: 'source-map'
};
