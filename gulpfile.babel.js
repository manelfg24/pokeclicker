const gulp = require('gulp');
const changed = require('gulp-changed');
const minifyHtml = require('gulp-minify-html');
const concat = require('gulp-concat');
const autoprefix = require('gulp-autoprefixer');
const minifyCSS = require('gulp-minify-css');
const typescript = require('gulp-typescript');
const browserSync = require('browser-sync');
const del = require('del');
const less = require('gulp-less');
const gulpImport = require('gulp-html-import');
const ejs = require("gulp-ejs");
const plumber = require("gulp-plumber");


/**
 * Push build to gh-pages
 */
gulp.task('deploy', () => gulp.src("./dist/**/*")
    .pipe(deploy()));

const srcs = {
    buildArtefacts: 'build/**/*',
    scripts: 'src/scripts/**/*.ts',
    html: ['src/*.html', 'src/templates/*.html', 'src/components/*.html'],
    ejsTemplates: ['src/templates/*.ejs'],
    styles: 'src/styles/**/*.less',
    assets: 'src/assets/**/*',
    libs: ['node_modules/bootstrap/dist/js/bootstrap.min.js',
        'node_modules/bootstrap/dist/css/bootstrap.min.css',
        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/popper.js/dist/umd/popper.min.js',
        'node_modules/knockout/build/output/knockout-latest.js',
        'node_modules/bootstrap-notify/bootstrap-notify.min.js',
        'src/libs/*.js'
    ]
};


const dests = {
    base: 'build',
    libs: 'build/libs/',
    assets: 'build/assets/',
    scripts: 'build/scripts/',
    styles: 'build/styles/',
    githubPages: 'docs/'
};

gulp.task('copy', () => gulp.src(srcs.libs)
    .pipe(gulp.dest(dests.libs))
    .pipe(browserSync.reload({stream: true})));

gulp.task('assets', () => gulp.src(srcs.assets)
    .pipe(changed(dests.assets))
    .pipe(gulp.dest(dests.assets))
    .pipe(browserSync.reload({stream: true})));

gulp.task('browserSync', () => {
    browserSync({
        server: {
            baseDir: dests.base
        }
    });
});

gulp.task('compile-html', (done) => {
    const htmlDest = './build';
    gulp.src('./src/index.html')
        .pipe(plumber())
        .pipe(gulpImport('./src/components/'))
        .pipe(ejs())
        .pipe(gulp.dest(htmlDest))
        .pipe(browserSync.reload({stream: true}));
    done();
});

gulp.task('html', () => {
    const htmlDest = './build';

    return gulp.src(srcs.html)
        .pipe(changed(dests.base))
        .pipe(minifyHtml())
        .pipe(gulp.dest(htmlDest))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('scripts', () => {
    let tsProject = typescript.createProject('tsconfig.json');
    return tsProject.src()
        .pipe(tsProject())
        .pipe(gulp.dest(dests.scripts))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('styles', () => gulp.src(srcs.styles)
    .pipe(less())
    .pipe(concat('styles.min.css'))
    .pipe(autoprefix('last 2 versions'))
    .pipe(minifyCSS())
    .pipe(gulp.dest(dests.styles))
    .pipe(browserSync.reload({stream: true})));

gulp.task('cleanWebsite', () => del([dests.githubPages]));

gulp.task('clean', () => del([dests.base]));

gulp.task('copyWebsite', () => {
    return gulp.src(srcs.buildArtefacts).pipe(gulp.dest(dests.githubPages));
});

gulp.task('build', done => {
    gulp.series('copy', 'assets', 'compile-html', 'scripts', 'styles')(done);
});

gulp.task('website', done => {
    gulp.series('clean', 'build', 'cleanWebsite', 'copyWebsite')(done);
});

gulp.task('default', done => {
    gulp.series('clean', 'build', 'browserSync', () => {
        gulp.watch(srcs.html, ['compile-html']);
        gulp.watch(srcs.ejsTemplates, ['compile-html']);
        gulp.watch(srcs.assets, ['assets']);
        gulp.watch(srcs.scripts, ['scripts']);
        gulp.watch(srcs.styles, ['styles']);
    })(done);
});
