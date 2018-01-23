const { promisify } = require('util');

const cache = require('gulp-cached');
const electron = require('electron-connect').server.create();
const electronPackager = require('electron-packager');
const gulp = require('gulp');
const gulpSequence = require('gulp-sequence');
const less = require('gulp-less');
const rimraf = promisify(require('rimraf'));
const ts = require('gulp-typescript');
const gulpTslint = require('gulp-tslint');
const tslint = require('tslint');
const useref = require('gulp-useref');

const tsProject = ts.createProject('tsconfig.release.json');

gulp.task('clean', (cb) => {
  return Promise.all([
    rimraf('out'),
    rimraf('build'),
  ]);
});

gulp.task('tslint', () => {
  const program = tslint.Linter.createProgram('tsconfig.release.json');

  return gulp.src(['src/**/*.{ts,tsx}', '!**/*.d.ts'])
    .pipe(gulpTslint({
      program,
    }))
    .pipe(gulpTslint.report({
      summarizeFailureOutput: true,
    }));
});

gulp.task('build:scripts', () => {
  const tsResult = gulp.src(['src/**/*.{ts,tsx}', '!**/*.d.ts'])
    .pipe(cache('scripts'))
    .pipe(tsProject());

  return tsResult.js.pipe(gulp.dest('build'));
});

gulp.task('build:html', () => {
  return gulp.src('src/index.html')
    .pipe(cache('html'))
    .pipe(gulp.dest('build'))
});

gulp.task('build:html:prod', () => {
  return gulp.src('src/index.html')
    .pipe(useref())
    .pipe(gulp.dest('build'))
});

gulp.task('build:styles', () => {
  return gulp.src('src/index.less')
    .pipe(less())
    .pipe(gulp.dest('build'))
});

gulp.task('watch', ['build'], () => {
  gulp.watch(['src/**/*.{ts,tsx}', '!**/*.d.ts'], ['build:scripts']);
  gulp.watch(['src/index.html'], ['build:html']);
  gulp.watch(['src/**/*.less'], ['build:styles']);

  gulp.watch(['build/**/*.js'], electron.restart);
  gulp.watch(['build/index.css'], electron.reload);
  gulp.watch(['build/index.html'], electron.reload);
});

gulp.task('electron:start', () => {
  electron.start();
});

gulp.task('electron:package', () => {
  return electronPackager({
    name: 'Airqmon',
    appCategoryType: 'public.app-category.weather',
    dir: './',
    ignore: [
      '^/src',
    ],
    asar: true,
    icon: './assets/airqmon.icns',
    overwrite: true,
    packageManager: 'yarn',
    out: './out',
    arch: 'x64',
    platform: 'darwin',
  });
});

gulp.task('build', gulpSequence('clean', ['build:scripts', 'build:html', 'build:styles']));
gulp.task('build:prod', gulpSequence('clean', ['build:scripts', 'build:html:prod', 'build:styles']));
gulp.task('start', gulpSequence('watch', 'electron:start'));
gulp.task('package', gulpSequence('build:prod', 'electron:package'));

gulp.task('default', ['start']);
