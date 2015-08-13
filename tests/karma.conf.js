module.exports = function (config) {
    'use strict';
    config.set({

        basePath: '..',

        frameworks: ['mocha'],

        files: [
            'node_modules/expect.js/index.js',
            'node_modules/sinon/pkg/sinon-1.15.4.js',
            'node_modules/mock-socket/dist/mock-socket.js',
            'bower_components/phosphor/dist/phosphor.js',
            'bower_components/js-logger/src/logger.js',
            'tests/build/test_app.js'
        ],

        reporters: ['mocha'],

        port: 9876,
        colors: true,
        singleRun: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        browsers: ['Chrome']

    });
};
