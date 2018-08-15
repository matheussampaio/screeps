const gulp = require('gulp')
const screeps = require('gulp-screeps')

const credentials = require('./.credentials.js')

gulp.task('publish', () => {
  return gulp.src('*.js', { cwd: 'dist' }).pipe(screeps(credentials))
})
