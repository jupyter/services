
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
var karma = require('karma').server;


var buildTypings = [
  './typings/es6-promise/es6-promise.d.ts',
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
  './mock-socket.d.ts'
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
    target: 'ES5',
  });

  var src = gulp.src(buildTypings.concat(tsSources))
    .pipe(gulpTypescript(project));

  var dts = src.dts.pipe(concat('jupyter-services.d.ts'))
    .pipe(gulp.dest('./dist'));

  var js = src.pipe(concat('jupyter-services.js'))
    .pipe(header('"use strict";\n'))
    .pipe(gulp.dest('./dist'));

  return stream.merge(dts, js);
});


gulp.task('build', ['src']);


gulp.task('dist', ['build'], function() {
  return gulp.src('./dist/jupyter-services.js')
    .pipe(uglify())
    .pipe(rename('jupyter-services.min.js'))
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


gulp.task('tests', function() {
  var project = gulpTypescript.createProject({
    typescript: typescript,
    experimentalDecorators: true,
    declarationFiles: false,
    noImplicitAny: true,
    target: 'ES5',
  });

  var sources = testsTypings.concat([
    'dist/jupyter-services.d.ts',
    'tests/test_utils.ts',
    'tests/**/*.ts'
  ]);

  return gulp.src(sources)
    .pipe(gulpTypescript(project))
    .pipe(concat('index.js'))
    .pipe(header('"use strict";\n'))
    .pipe(gulp.dest('tests/build'));
});


gulp.task('karma', function () {
  karma.start({
    configFile: __dirname + '/tests/karma.conf.js',
  });
});


gulp.task('default', ['dist']);
