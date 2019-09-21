const gulp = require('gulp'),
  pug = require('gulp-pug'),
  plumber = require('gulp-plumber'),
  notify = require('gulp-notify'),
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  cleancss = require('gulp-clean-css'),
  gcmq = require('gulp-group-css-media-queries'), // Объединение медиа запросов в css
  uglify = require('gulp-uglify-es').default,
  browserSync = require('browser-sync'),
  concat = require('gulp-concat'),
  rename = require('gulp-rename'),
  svgSprite = require('gulp-svg-sprite'), //Создание SVG спрайтов
  svgmin = require('gulp-svgmin'),
  cheerio = require('gulp-cheerio'), // удаление из SVG ненужных аттрибутов
  del = require('del');

// Local Server
gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: 'dist'
    },
    notify: false
    // online: false, // Work offline without internet connection
    // tunnel: true, tunnel: 'projectname', // Demonstration page: http://projectname.localtunnel.me
  });
});
function reload(done) {
  browserSync.reload();
  done();
}

// PUG
gulp.task('pug', function() {
  return gulp
    .src('app/pug/*.pug')
    .pipe(
      plumber({
        errorHandler: notify.onError()
      })
    )
    .pipe(pug({ pretty: true }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('html', function() {
  return gulp.src('dist/**/*.html').pipe(browserSync.reload({ stream: true }));
});

// SASS
gulp.task('sass', function() {
  return gulp
    .src('app/sass/**/*.sass')
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(concat('style.min.css'))
    .pipe(
      autoprefixer({
        grid: true,
        overrideBrowserslist: ['last 10 versions']
      })
    )
    .pipe(gcmq())
    .pipe(cleancss({ level: { 1: { specialComments: 0 } } }))
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.stream());
});

// Scripts & JS Libraries
gulp.task('js', function() {
  return gulp
    .src([
      // 'node_modules/jquery/dist/jquery.min.js', // Optional jQuery plug-in (npm i --save-dev jquery)
      'app/js/_lazy.js', // JS library plug-in example
      'app/js/_custom.js' // Custom scripts. Always at the end
    ])
    .pipe(concat('scripts.min.js'))
    .pipe(uglify()) // Minify js (opt.)
    .pipe(gulp.dest('dist/js'))
    .pipe(browserSync.reload({ stream: true }));
});

// SVG SPRITE
gulp.task('svg', function() {
  return gulp
    .src('app/img/svg/**/*.svg')
    .pipe(
      svgmin({
        plugins: [
          { removeDoctype: true },
          { removeComments: true },
          { removeStyleElement: true },
          { removeXMLNS: true },
          { removeDimensions: true },
          { collapseGroups: true }
        ],
        js2svg: { pretty: true }
      })
    )
    .pipe(
      cheerio({
        run: function($) {
          $('[fill]').removeAttr('fill');
          $('[data-name]').removeAttr('data-name');
          $('[class]').removeAttr('class');
          $('path[id]').removeAttr('id');
          $('[stroke]').removeAttr('stroke');
          $('[style]').removeAttr('style');
        },
        parserOptions: { xmlMode: true }
      })
    )
    .pipe(
      svgSprite({
        mode: {
          symbol: { sprite: '../sprite.svg' }
        }
      })
    )
    .pipe(gulp.dest('dist/img'));
});

gulp.task('fonts', function() {
  return gulp.src('app/fonts/**/*.*').pipe(gulp.dest('dist/fonts'));
});

gulp.task('images', function() {
  return gulp
    .src(['app/img/**/*.*', '!app/img/svg'])
    .pipe(gulp.dest('dist/img'));
});

gulp.task('watch', function() {
  gulp.watch('app/pug/**/*.pug', gulp.series('pug'));
  gulp.watch('app/sass/**/*.sass', gulp.parallel('sass'));
  gulp.watch(['libs/**/*.js', 'app/js/_custom.js'], gulp.parallel('js'));
  gulp.watch('app/img/svg/**/*.svg', gulp.parallel('svg'));
  gulp.watch('dist/*.html', gulp.parallel(reload));
  gulp.watch('app/fonts/**/*.*', gulp.parallel('fonts'));
  gulp.watch(
    ['app/img/**/*.*', '!app/img/svg/**/*.*'],
    gulp.parallel('images')
  );
});

gulp.task(
  'default',
  gulp.series(
    gulp.parallel(
      'fonts',
      'images',
      'pug',
      'sass',
      'js',
      'svg',
      'browser-sync',
      'watch'
    ),
    'html'
  )
);
