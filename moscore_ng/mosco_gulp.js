'use strict';
module.exports = {
	config: config,
	styles: styles,
	copy:copy,
	export: copy_export,
	up: up,
	watch: watch,
	watchup: watchup
};

var gulp = require('gulp'),
	less = require('gulp-less'),
	prefix = require('gulp-autoprefixer'),
	ignore = require('gulp-ignore'),
	ftp = require('gulp-ftp'),
	//cache = require('gulp-cache'),
	path = require('path'),
	minimatch = require('minimatch'),
	files,
	gulpfile_glob = ['**/*gulp*.js', '../**/*gulp*.js'],
	cwd = path.resolve('./'),
	build_dest = path.resolve('./build'),
	export_dest = path.resolve('../exported')

function mm(path, globs) {
	return globs.some(match);
	function match(glob) {
		return minimatch(path, glob);
	}
}

function config(files_) {
	files = files_;
	if (files.build_dest) {
		build_dest = path.resolve(files.build_dest);
	}
	if (files.export_dest) {
		export_dest = path.resolve(files.export_dest);
	}
}

function styles(errcb, src) {
	if (src) {
		console.log('Processing Styles ', src);
	}
	return gulp.src(src || files.styles)
		.pipe(less({
			paths: [ cwd ]
		}).on('error', console.dir.bind(console)))
		.pipe(prefix("last 2 versions", "> 1%", "ie 9"))
		.pipe(gulp.dest(build_dest));
}

function copy(errcb, src) {
	var lsrc = src;
	src = src && path.resolve(src);
	if (src && !mm(src, gulpfile_glob)) {
		console.log('copying ', src);
	} else if (src) {
		console.log('ignoring', src);
		return;
	}
	return gulp.src(src || files.copy, {base: cwd})
		.pipe(ignore.exclude(gulpfile_glob))
		.pipe(gulp.dest(build_dest));
}

function copy_export(errcb) {
	var src = path.join(build_dest, '**');
	console.log('exporting from ', src, ' to ', export_dest);
	return gulp.src(src, {base: build_dest})
		.pipe(gulp.dest(export_dest));
}

function up(errcb, src) {
	if (src) {
		console.log('Uploading ', src);
	}
	var ftp_pwd = require('fs').readFileSync('.ftp_pwd');
	return gulp.src(src || 'build/**/*', {base: path.join(cwd, 'build')})
		.pipe(ftp({
			host: 'moscore.com',
			user: 'moscore',
			pass: ftp_pwd,
			remotePath: '/public_html/scoreboard/'
		}));
}

function watch() {
	gulp.watch(files.copy).on('change', function(event) {
		var relPath = path.relative(cwd, event.path);
		copy(null, relPath);
	});
	gulp.watch(files.styles).on('change', function(event) {
		styles(null, event.path);
	});
}

function watchup() {
	gulp.watch('build/**/*').on('change', function(event) {
		up(null, event.path);
	});
}
