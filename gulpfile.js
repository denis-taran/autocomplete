var gulp = require('gulp');
var ts = require('gulp-typescript');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');
var fs = require('fs');
var gutil = require('gulp-util');
var tsProject = ts.createProject("tsconfig.json");

var tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8')).compilerOptions;

var template = "(function (factory) {\r\n" +
               "    if (typeof define === 'function' && define.amd) {\r\n" +
               "        define(factory);\r\n" +
               "    } else if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {\r\n" +
               "        var f = factory();\r\n" +
               "        Object.defineProperty(exports, '__esModule', { value: true });\r\n" +
               "        exports.autocomplete = f;\r\n" +
               "        exports.default = f;\r\n" +
               "    } else {\r\n" +
               "        window['autocomplete'] = factory();\r\n" +
               "    }\r\n" +
               "})(function () {\r\n" +
               "    \"use strict\""

gulp.task('default', function () {
    return tsProject.src()
        .pipe(tsProject())
        .pipe(replace(/^(\n|\r|.)+"use strict"/gmi, template))
        .pipe(replace("exports.autocomplete = autocomplete;", "return autocomplete;"))
        .pipe(replace('Object.defineProperty(exports, "__esModule", { value: true });', ""))
        .pipe(replace("exports.default = autocomplete;", ""))
        .pipe(gulp.dest('.'));
});

gulp.task("minify", function() {
    return gulp.src('./autocomplete.js')
               .pipe(uglify({ unsafe: true }).on('error', gutil.log))
               .pipe(gulp.dest('.'));
});

gulp.task('watch', function() {
    gulp.watch('./autocomplete.ts', ['default', 'minify']);
});