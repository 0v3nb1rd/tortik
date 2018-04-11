"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var server = require("browser-sync").create();

var csso = require("gulp-csso"),
    run =require("run-sequence"),
    del = require("del"),
    rename = require("gulp-rename"),
    normalize = require("node-normalize-scss"),
    posthtml = require("gulp-posthtml"),
    include = require("posthtml-include"),
    svgstore = require("gulp-svgstore"),
    imagemin = require("gulp-imagemin"),
    webp = require("gulp-webp"),
    htmlhint = require("gulp-htmlhint"),
    htmlmin = require("gulp-htmlmin"),
    uglify = require("gulp-uglify");
    // materialize = require("materialize-css");
///////////////////////////////////////////////////////////


gulp.task("clear", function() {
  return del("build");
});

gulp.task("copy", function() {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
    "source/css/**.css",
    "source/js/bin/*.js"], {
      base: "./source/"
    })
  .pipe(gulp.dest("build"));
});

gulp.task("sprite", function() {
  return gulp.src("build/img/icon-*.svg")
  .pipe(svgstore({
    inlineSvg: true
  }))
  .pipe(rename("sprite.svg"))
  .pipe(gulp.dest("build/img"));
});

gulp.task("html", function() {
  return gulp.src("source/*.html")
  .pipe(posthtml([
    include()
    ]))
  .pipe(gulp.dest("build"));
});

//////////////////////////////////////////////////////////
gulp.task("style", function() {
  gulp.src("source/sass/materialize.scss")
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'expanded',
      includePaths: require('node-normalize-scss').includePaths
      }).on('error', sass.logError))
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest("build/css"))
    .pipe(csso())
    .pipe(rename("materialize.min.css"))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});

gulp.task("serve", function() {
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/sass/**/*.{scss,sass}", ["style"]);
  gulp.watch("source/*.html", ["html"]).on("change", server.reload);
});
//////////////////////////////////////////////////////////////////////////////////////////////

gulp.task("minjs", function() {
  return gulp.src("build/js/*.js")
  .pipe(uglify())
  .pipe(rename(function (path) {
    path.basename += "-min";
    path.extname = ".js"
  }))
  .pipe(gulp.dest("build/js"))
})

gulp.task("imgmin", function() {
  return gulp.src("source/img/*.{jpg,png,svg}")
  .pipe(imagemin([
    imagemin.optipng({optimizationLevel: 3}),
    imagemin.jpegtran({progressive: true}),
    imagemin.svgo()
    ]))
  .pipe(gulp.dest("build/img"));
});

gulp.task("webp", function() {
  return gulp.src("build/img/*.{jpg,png}")
  .pipe(webp({
    quality: 90
  }))
  .pipe(gulp.dest("build/img/webp"));
});

gulp.task("build", function(done) {
  run(
    "clear", "copy", "imgmin",
    "style", "sprite", "html",
    /*"minjs",*/ "webp", done);
});

gulp.task("minify", function() {
  return gulp.src("build/*.html")
  .pipe(htmlmin({collapseWhitespace: true}))
  .pipe(gulp.dest("build"));
});

gulp.task("valid", function() {
  return gulp.src("build/*html")
  .pipe(htmlhint())
  .pipe(htmlhint.failAfterError());
});
