var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('copyDependencies', function() {
    gulp.src([
            'node_modules/angular/angular.min.js',
            'node_modules/jquery/dist/jquery.min.js',
            'node_modules/bootstrap/dist/css/bootstrap.min.css',
            'node_modules/bootstrap/dist/js/bootstrap.min.js',
            'node_modules/font-awesome/css/font-awesome.min.css',
            'node_modules/font-awesome/fonts/fontawesome-webfont.woff',
            'node_modules/font-awesome/fonts/fontawesome-webfont.woff2',
            'node_modules/typeahead.js/dist/typeahead.bundle.min.js'
        ])
        .pipe(gulp.dest('public/dependencies/'));
});

gulp.task('copySources', function() {
    gulp.src([
            '*font/**',
            '*js/**',
            '*view/**'
        ], {
            base: "."
        })
        .pipe(gulp.dest('public/'));
});

gulp.task('sass', function() {
    return gulp.src('sass/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('public/css'));
});

gulp.task('copyPages', function() {
    gulp.src([
            'page/demo.html'
        ])
        .pipe(gulp.dest('public/'));
});

gulp.task('default', ['copyPages', 'copySources', 'copyDependencies', 'sass']);