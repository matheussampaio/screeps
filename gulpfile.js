const dotenv = require('dotenv')
const gulp = require('gulp')
const screeps = require('gulp-screeps')

dotenv.config()

gulp.task('upload', () => {
  const options = getOptions()

  return gulp.src('main.js', { cwd: 'dist' })
    .pipe(screeps(options))
})

function getOptions() {
  if (process.env.SCREEPS_PRIVATE_SERVER) {
    return {
      host: process.env.SCREEPS_PRIVATE_HOST || 'localhost',
      port: process.env.SCREEPS_PRIVATE_PORT || 21025,
      password: process.env.SCREEPS_PRIVATE_PASSWORD,
      email: process.env.SCREEPS_PRIVATE_EMAIL,
      branch: process.env.SCREEPS_PRIVATE_BRANCH || 'default'
    }
  }

  return {
    token: process.env.SCREEPS_TOKEN,
    branch: process.env.SCREEPS_BRANCH || 'default'
  }
}
