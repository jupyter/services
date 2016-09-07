var version = require('./package.json').version;

module.exports = {
    entry: './lib',
    output: {
        filename: './dist/index.js',
        library: 'jupyter-js-services',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        publicPath: 'https://unpkg.com/jupyter-js-services@' + version + '/dist/'
    },
    bail: true,
    devtool: 'source-map'
};
