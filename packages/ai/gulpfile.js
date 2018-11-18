const gulp = require('gulp')
const screeps = require('gulp-screeps')

const credentials = {
  email: process.env.SCREEPS_EMAIL,
  password: process.env.SCREEPS_TOKEN,
  branch: process.env.SCREEPS_BRANCH || 'default'
}

gulp.task('publish', () => {
  return gulp.src('*.js', { cwd: 'dist' })
    .pipe(screeps(credentials))
})
