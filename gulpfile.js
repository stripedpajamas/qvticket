const gulp = require('gulp');
const zip = require('gulp-zip');
const del = require('del');

gulp.task('clean', () => del(['manifest/**/*']))

gulp.task('generate-manifest', () => {
  gulp.src(['src/static/images/*.png', 'src/manifest.json'])
    .pipe(zip('qvticket.zip'))
    .pipe(gulp.dest('manifest'))
})

gulp.task('default', ['clean', 'generate-manifest'], () => {
  console.log('Build completed. Output in manifest folder')
})