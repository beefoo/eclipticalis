var gulp = require('gulp');

// config
var config = require('./src/config');

// utilities
var include = require('gulp-include');
var rename = require('gulp-rename');

// Sass compilation

var sass = require('gulp-sass');

gulp.task('sass', function () {
  gulp.src(config.sass.src)
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(sass(config.sass.opt))
    .pipe(gulp.dest(config.sass.dest));
});

// Javascript compilation

var uglify = require('gulp-uglify');

gulp.task('js', function() {
  gulp.src(config.include.src)
    // include non-minified version
    .pipe(include(config.include.opt).on('error', console.error.bind(console)))
    .pipe(gulp.dest(config.include.dest))
    // and the minified version
    .pipe(uglify(config.uglify.opt).on('error', console.error.bind(console)))
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest(config.uglify.dest));
});

// Connect

var connect = require('gulp-connect');

gulp.task('connect', function() {
  connect.server(config.server.opt);
});

// Watchers

gulp.task('watch', function () {
  gulp.watch(config.sass.src, ['sass']);
  gulp.watch(config.uglify.src, ['js']);
});

gulp.task('default', ['connect','watch', 'sass', 'js']);
