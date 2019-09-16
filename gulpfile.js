const dotenv = require('dotenv')
const gulp = require('gulp')
const screeps = require('gulp-screeps')

dotenv.config()

const credentials = {
  token: process.env.SCREEPS_TOKEN,
  branch: process.env.SCREEPS_BRANCH || 'default'
}

gulp.task('upload', () => {
  return gulp.src('main.js', { cwd: 'dist' })
    .pipe(screeps(credentials))
})
