var gulp = require('gulp');
var less = require('gulp-less');
 
gulp.task('less', function() {
 setTimeout( function() {
    gulp.src('less/main.less')
      .pipe(less())
      .pipe(gulp.dest('css'));
 }, 1000);
});
 
gulp.task('watch', function() {
    gulp.watch('less/*.less', ['less']);
})
 
gulp.task('default', ['less', 'watch']);
