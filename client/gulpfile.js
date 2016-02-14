var gulp = require('gulp');
var less = require('gulp-less');
var minifyCss = require('gulp-minify-css');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');

var jsWatchDirs 	= 'js/**/*';
var cssWatchDirs 	= 'less/**.less';
var distDir 		= 'dist'

gulp.task('minifyJs', function() {
 setTimeout( function() {
    gulp.src(jsWatchDirs)
      .pipe(ngAnnotate())
      .pipe(concat('/js.min.js'))
      .pipe(uglify())
      .on('error', function(err){
        console.log(err);
      })
      .pipe(gulp.dest(distDir));
 }, 1000);
});

gulp.task('less', function() {
 setTimeout( function() {
    gulp.src(cssWatchDirs)
      .pipe(less())
      .pipe(minifyCss({compatibility: 'ie8'}))
      .pipe(gulp.dest(distDir));
 }, 1000);
});

gulp.task('watchJs', function() {
    gulp.watch(jsWatchDirs, ['minifyJs']);
})

gulp.task('watchCss', function() {
    gulp.watch(cssWatchDirs, ['less']);
})
 
gulp.task('default', ['watchJs', 'watchCss']);