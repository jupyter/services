module.exports = function (config) {
    'use strict';
    config.set({

        basePath: '..',

        frameworks: ['mocha'],

        files: [
            'node_modules/mock-socket/dist/mock-socket.js',
            'test/build/app.js'
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
