const gulp = require('gulp');
const screeps = require('gulp-screeps');

const credentials = require('./.credentials.js');

gulp.task('publish', () => {
    gulp.src('*.js', { cwd: 'default' }).pipe(screeps(credentials));
});
