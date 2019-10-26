const dotenv = require('dotenv')
const gulp = require('gulp')
const screeps = require('gulp-screeps')

dotenv.config()

gulp.task('upload', () => {
  return gulp.src('main.js', { cwd: 'dist' })
    .pipe(screeps(getOptions()))
})

function getOptions() {
  if (process.env.SCREEPS_PRIVATE_SERVER) {
    return {
      host: 'localhost',
      port: 21025,
      password: process.env.SCREEPS_PASSWORD,
      email: process.env.SCREEPS_EMAIL
    }
  }

  return {
    token: process.env.SCREEPS_TOKEN,
    branch: process.env.SCREEPS_BRANCH || 'default'
  }
}
