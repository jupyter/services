
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

var del = require('del');
var concat = require('gulp-concat');
var gulp = require('gulp');
var header = require('gulp-header');
var nib = require('nib');
var rename = require('gulp-rename');
var stream = require('event-stream');
var stylus = require('gulp-stylus');
var typedoc = require('gulp-typedoc');
var typescript = require('typescript');
var gulpTypescript = require('gulp-typescript');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var karma = require('karma').server;
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var dbundle = require('dts-bundle');



var buildTypings = [
  './typings/requirejs/require.d.ts',
  './typings/text-encoding/text-encoding.d.ts',
  './bower_components/phosphor/dist/phosphor.d.ts',
  './logger.d.ts',
  './es6.d.ts'
];

var testsTypings = buildTypings.concat([
  './typings/expect.js/expect.js.d.ts',
  './typings/mocha/mocha.d.ts',
  './typings/sinon/sinon.d.ts',
  './mock-socket.d.ts',
]);


var tsSources = [
  'serialize',
  'kernel',
  'session',
  'utils',
].map(function(name) { return './src/' + name + '.ts'; });


gulp.task('clean', function(cb) {
  del(['./dist'], cb);
});


gulp.task('src', function() {
  var project = gulpTypescript.createProject({
    typescript: typescript,
    experimentalDecorators: true,
    declarationFiles: true,
    noImplicitAny: true,
    target: 'ES6',
  });

  var src = gulp.src(buildTypings.concat(tsSources).concat(['src/index.ts']))
    .pipe(gulpTypescript(project));

  var js = src.pipe(babel()).pipe(gulp.dest('./node_modules/jupyter-js-services'));

  var dts = src.dts.pipe(gulp.dest('./node_modules/jupyter-js-services'));

  return js;
});


gulp.task('build', ['src'], function () {

  var dts = dbundle.bundle({
        name: 'jupyter-js-services',
        main: 'node_modules/jupyter-js-services/index.d.ts',
        out: '../dist/jupyter-js-services.d.ts'
    });
  return dts;

});


gulp.task('dist', ['build'], function() {
  var b = browserify({
    entries: 'lib/index.js',
    debug: true
  })

  return b.bundle()
    .pipe(source('jupyter-js-services.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./dist'));
});


gulp.task('watch', function() {
  gulp.watch(tsSources, ['src']);
});


gulp.task('docs', function() {
  return gulp.src(buildTypings.concat(tsSources))
    .pipe(typedoc({
      out: './build/docs',
      name: 'Jupyter Services',
      target: 'ES5',
      mode: 'file',
      includeDeclarations: false }));
});


gulp.task('build-tests', function() {
  var project = gulpTypescript.createProject({
    typescript: typescript,
    experimentalDecorators: true,
    declarationFiles: false,
    noImplicitAny: true,
    target: 'ES6',
  });

  var src = gulp.src(testsTypings.concat([
    'dist/jupyter-js-services.d.ts',
    './tests/src/*.ts'
  ])).pipe(gulpTypescript(project));

  var js = src.pipe(babel()).pipe(gulp.dest('./tests/build'));

  return js;
});


gulp.task('tests', ['build-tests'], function () {

  var b = browserify({
    entries: './tests/build/index.js',
    debug: true,
    external: './dist/jupyter-js-services.js'
  });

  return b.bundle()
    .pipe(source('test_app.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./tests/build'));
});


gulp.task('karma', function () {
  karma.start({
    configFile: __dirname + '/tests/karma.conf.js',
  });
});


gulp.task('default', ['dist']);
