/* global process */
const gulp = require('gulp');
const babel = require('gulp-babel');
const sass = require('gulp-sass');
const del = require('del');
const nodemon = require('gulp-nodemon');
const uglify = require('gulp-uglify');
const noop = require('gulp-noop');
const concat = require('gulp-concat');

sass.compiler = require('node-sass');

console.log(`Gulp run under NODE_ENV=${process.env.NODE_ENV}`);

const clean = cb => {
  /* Since del returns a promise, resolve it with additional func */
  del(['dist/**/*']).then(() => cb());
};
const util_style = cb => {
  gulp.src('./app/style/*.sass')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('dist/style/'));
  gulp.src('./app/style/*.css')
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest('dist/style/'));
  cb();
};
const util_script = cb => {
  gulp.src('app/script/*.babel.js')
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .on('error', err => console.log(err.toString()))
    .pipe(concat('horrific.js'))
    .pipe(process.env.NODE_ENV !== 'dev' ? uglify() : noop())
    .pipe(gulp.dest('dist/script/'));
  gulp.src('app/script/*.min.js')
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('dist/script/'));
  cb();
};
const util_static = cb => {
  gulp.src('static/*')
    .pipe(gulp.symlink('dist/static'));
  cb();
};
const build_utils = () => {
  return gulp.parallel(util_style, util_script, util_static);
};

/* Dev */
const watch = cb => {
  gulp.watch('app/script/*.js', util_script);
  gulp.watch('app/style/*', util_style);
  gulp.watch('app/static/*', util_static);
  cb();
};
const task_nodemon = cb => {
  let started = false;
  return nodemon({
    script: 'server.js',
    watch: ['route.js', 'server.js', 'utils.js', 'app/pug/*'],
    env: { 'NODE_ENV': 'dev' },
    ignore: ['dist/**'],
  }).on('start', () => {
    if(!started) {
      started = true;
      cb();
    }
    started = true;
  });
};
const task_browserSync = cb => {
  const browserSync =  require('browser-sync');
  const prepro = gulp.parallel(task_nodemon, watch);
  const task = () => {
    browserSync.init(null, {
      proxy: 'http://localhost:9999',
      files: ['dist/script/*', 'dist/style/*', './app/pug/*'],
      browser: ['chrome'],
      port: 5000,
      reloadDelay: 1500,
    });
  };
  return gulp.series(clean, build_utils(), prepro, task);
};
if(process.env.NODE_ENV === 'dev')
  exports.dev = task_browserSync();

const defaultTask = () => {
  return gulp.series(clean, build_utils());
};
exports.default = defaultTask();


