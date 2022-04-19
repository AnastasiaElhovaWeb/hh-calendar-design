const browserSync = require('browser-sync').create();
const cheerio = require('gulp-cheerio');
const concat = require('gulp-concat');
const del = require('del');
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const pug = require('gulp-pug');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const prefixer = require('autoprefixer');
const replace = require('gulp-replace');
const svgmin = require('gulp-svgmin');
const svgSprite = require('gulp-svg-sprite');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');

/**
 * Configuring paths
 * @type {Object}
 */

const paths = {
    src: {
        html: 'src/pug/*.pug',
        scripts: 'src/scripts/**/*',
        styles: 'src/styles/**/*.scss',
        image: 'src/image/**/*',
        images: 'src/images/**/*',
        fonts: 'src/fonts/**/*',
        sprites: 'src/sprites/*.svg',
    },
    watch: {
        html: 'src/pug/**/*.pug',
        scripts: 'src/scripts/**/*.js',
        styles: 'src/styles/**/*.scss',
        image: 'src/image/**/*',
        images: 'src/images/**/*',
        fonts: 'src/assets/fonts',
    },
    build: {
        html: 'www',
        scripts: 'www/assets/js',
        styles: 'www/assets/css',
        image: 'www/assets/image',
        images: 'www/assets/images',
        fonts: 'www/assets/fonts',
    }
};

function clean () {
    return del(paths.build.html + '/**');
}

function html() {
    return gulp.src(paths.src.html)
        .pipe(pug({pretty: true}))
        .on('error', function (err) {
            process.stderr.write(err.message + '\n');
            this.emit('end');
        })
        .pipe(gulp.dest(paths.build.html));
}

function css() {
    return gulp.src([paths.src.styles])
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(postcss([prefixer()]))
        .pipe(gulp.dest(paths.build.styles));
}

function fonts() {
    return gulp.src(paths.src.fonts)
        .pipe(gulp.dest(paths.build.fonts));
}

function copyJs() {
    return gulp.src(paths.src.scripts)
        .pipe(babel({
            presets: ['@babel/env'],
            plugins: [
                'transform-class-properties',
            ],
        }))
        .pipe(gulp.dest(paths.build.scripts));
}

function jsVendor() {
    return gulp.src([
        'src/libs/bootstrap/js/bootstrap.min.js',
    ])
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(gulp.dest(paths.build.scripts));
}

function image() {
    return gulp.src([paths.src.image])
        .pipe(imagemin([
            imagemin.mozjpeg({quality: 85, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(gulp.dest(paths.build.image))
}

function images() {
    return gulp.src([paths.src.images])
        .pipe(imagemin([
                imagemin.mozjpeg({quality: 85, progressive: true}),
                imagemin.optipng({optimizationLevel: 5}),
                imagemin.svgo({
                    plugins: [
                        {removeViewBox: true},
                        {cleanupIDs: false}
                    ]
                })
            ]
        ))
        .pipe(gulp.dest(paths.build.images))
}

function svgSpriteBuild() {
    return gulp.src(paths.src.sprites)
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        .pipe(cheerio({
            run: function ($) {

            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(replace('&gt;', '>'))
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: "../sprite.svg"  //sprite file name
                }
            },
        }))
        .pipe(gulp.dest(paths.build.image));
}

function reload(done) {
    browserSync.reload();
    done();
}

function watchSrc(done) {
    gulp.watch(paths.watch.styles, gulp.series(css, reload));
    gulp.watch(paths.watch.scripts, gulp.series(copyJs, reload));
    gulp.watch(paths.watch.html, gulp.series(html, reload));
    gulp.watch(paths.watch.image, gulp.series(image, reload));
    gulp.watch(paths.watch.fonts, gulp.series(fonts, reload));
    done();
}

function browser(done) {
    browserSync.init({
        server: {
            baseDir: paths.build.html
        },
        port: 8080,
        notify: false
    });
    done();
}

const build = gulp.parallel(html, css, fonts, svgSpriteBuild, jsVendor, image, images, copyJs);

exports.default = gulp.series(clean, build);

exports.watch = gulp.series(browser, watchSrc);

exports.html = (html);

exports.css = (css);

exports.copyJs =(copyJs);

exports.jsVendor =(jsVendor);

exports.svgSpriteBuild =(svgSpriteBuild);

exports.images =(images);

