const gulp = require('gulp'),
	path = require('path'),
	pug = require('gulp-pug'),
	less = require('gulp-less'),
	surge = require('gulp-surge'),
	autoPrefixer = require('autoprefixer'),
	minify = require('cssnano'),
	sourceMaps = require('gulp-sourcemaps'),
	concat = require('gulp-concat'),
	plumber = require('gulp-plumber'),
	notify = require('gulp-notify'),
	postCss = require('gulp-postcss'),
	browserSync = require('browser-sync').create(),
	babel = require('rollup-plugin-babel'),
	runSequence = require('run-sequence'),
	webpack = require('webpack-stream'),
	del = require('del'),
	join = path.join;


var DEST = 'out',
	SRC = 'src',
	TEMPLATES = join(SRC, 'templates'),
	STYLES = join(SRC, 'styles'),
	SCRIPTS = join(SRC, 'scripts'),
	IMAGES = join(SRC, 'images'),
	DEPLOY = 'something.surge.sh';


gulp.task('styles', function() {
	const processors = [
		autoPrefixer({browsers: ['last 2 versions']}),
		minify()
	];

	return gulp.src(join(STYLES, 'main.less'))
		.pipe(plumber({
			errorHandler: notify.onError(function(err) {
				return {
					title: "Styles",
					message: err.message
				}
			})
		}))
		.pipe(sourceMaps.init())
		.pipe(less())
		.pipe(postCss(processors))
		.pipe(concat('styles.css'))
		.pipe(sourceMaps.write())
		.pipe(gulp.dest(join(DEST, 'styles')));
});

gulp.task('images', function(){
	return gulp.src(join(IMAGES, '**/*.+(png|jpg|jpeg|gif|svg)'))
	.pipe(gulp.dest(join(DEST, 'images')));
});


gulp.task('templates', function(){
	return gulp.src(join(TEMPLATES, '**/*.pug'))
	.pipe(pug({
		compileDebug: false,
		pretty: true
	}))
	.pipe(gulp.dest(DEST));
});

gulp.task('scripts', function() {
	return gulp.src(join(SCRIPTS, 'app.js'))
		.pipe(plumber({
			errorHandler: notify.onError(function(err) {
				return {
					title: "Scripts",
					message: err.message
				}
			})
		}))
		.pipe(sourceMaps.init())
		.pipe(babel())
		.pipe(webpack({
			output: {
				filename: 'bundle.js',
			},
		}))
		.pipe(sourceMaps.write())
		.pipe(gulp.dest(join(DEST, 'scripts')));
});

gulp.task('clean', function() {
	return del(DEST);
});

gulp.task('default', function () {
	runSequence('clean',
		['templates', 'styles', 'scripts', 'images']
	)
})

// W A T C H

gulp.task('clean:dist', function() {
	return del.sync(DEST);
});

gulp.task('templates:sync', ['templates'], function(done) {
	browserSync.reload();
	done();
});

gulp.task('styles:sync', ['styles'], function(done) {
	browserSync.reload();
	done();
});

gulp.task('scripts:sync', ['scripts'], function(done) {
	browserSync.reload();
	done();
});

gulp.task('browserSync', function() {
	browserSync.init({
		server: {
			baseDir: './out'
		},
	})
	gulp.watch(join(TEMPLATES, '**/*.pug'), ['templates:sync']);
	gulp.watch(join(STYLES, '**/*.less'), ['styles:sync']);
	gulp.watch(join(SCRIPTS, '**/*.js'), ['scripts:sync']);
	gulp.watch(join(SRC, 'img/*'), ['images']);
})

gulp.task('watch', ['browserSync'], function() {
	gulp.watch(join(TEMPLATES, '**/*.pug'), ['templates']);
	gulp.watch(join(STYLES, '**/*.less'), ['styles']);
	gulp.watch(join(SCRIPTS, '**/*.js'), ['scripts']);
	gulp.watch(join(SRC, 'img/*'), ['images']);
})

// D E P L O Y

gulp.task('deploy', ['default'], function () {
	return surge({
		project: DEST,         // Path to your static build directory
		domain: DEPLOY  // Your domain or Surge subdomain
	})
})
