var gulp = require('gulp'),
	less = require('gulp-less'),
	prefix = require('gulp-autoprefixer'),
	ignore = require('gulp-ignore'),
	ftp = require('gulp-ftp'),
	path = require('path');

var files = {
	copy: ['*.php', '*.js', '*.html', 'templates/**/*.html'],
	styles: ['*.less']
};
gulp.task('styles', styles);
function styles(errcb, src) {
	if (src) {
		console.log('Processing Styles ', src);
	}
	return gulp.src(src || files.styles)
		.pipe(less({
			paths: [ __dirname ]
		}).on('error', console.dir.bind(console)))
		.pipe(prefix("last 2 versions", "> 1%", "ie 9"))
		.pipe(gulp.dest('./build'));
}

gulp.task('copy', copy);
function copy(errcb, src) {
	if (src) {
		console.log('copying ', src);
	}
	return gulp.src(src || files.copy, {base: __dirname})
		.pipe(ignore.exclude('**/gulpfile.js'))
		.pipe(gulp.dest('./build'));
}

gulp.task('up', up);
function up(errcb, src) {
	if (src) {
		console.log('Uploading ', src);
	}
	var ftp_pwd = require('fs').readFileSync('.ftp_pwd');
	return gulp.src(src || 'build/**/*', {base: path.join(__dirname, 'build')})
		.pipe(ftp({
			host: 'moscore.com',
			user: 'moscore',
			pass: ftp_pwd,
			remotePath: '/public_html/scoreboard/'
		}));
}
gulp.task('watch', function() {
	gulp.watch(files.copy).on('change', function(event) {
		var relPath = path.relative(__dirname, event.path);
		copy(null, relPath);
	});
	gulp.watch(files.styles).on('change', function(event) {
		styles(null, event.path);
	});
})

gulp.task('watchup', ['watch'], function() {
	gulp.watch('build/**/*').on('change', function(event) {
		up(null, event.path);
	});
});
gulp.task('default', ['styles', 'copy']);
