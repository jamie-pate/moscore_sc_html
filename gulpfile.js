var gulp = require('gulp'),
	m_gulp = require('./moscore_ng/mosco_gulp.js');

m_gulp.config({
	copy: ['*.php', '*.js', '*.html', 'templates/**/*.html', 'README.md',
		'../moscore_ng/mosco.js', 'moscore_ng/mosco.js', 'media/*.gif', 'libs/*.js'],
	styles: ['*.less'],
	build_dest: 'build/scoreboard',
	export_dest: '../moscore_qm/run/scoreboard'
});
try {
	require('./gulp.local');
} catch (ex) {}
gulp.task('styles', m_gulp.styles);
gulp.task('copy', m_gulp.copy);
gulp.task('export', ['styles', 'copy'], m_gulp.export);
gulp.task('up', m_gulp.up);
gulp.task('watch', m_gulp.watch);

gulp.task('watchup', ['watch'], m_gulp.watchup);
gulp.task('default', ['styles', 'copy']);
