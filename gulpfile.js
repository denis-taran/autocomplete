var gulp = require('gulp');
var ts = require('gulp-typescript');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');
var fs = require('fs');

var tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8')).compilerOptions;

// fix for: https://github.com/Microsoft/TypeScript/issues/8436
var template = "(function (root, factory) {\r\n" +
               "    if (typeof define === 'function' && define.amd) {\r\n" +
               "        define('Autocomplete', [], factory);\r\n" +
               "    } else if (typeof exports === 'object') {\r\n" +
               "        module.exports = factory(require, exports);\r\n" +
               "    } else {\r\n" +
               "        factory(null, root);\r\n" +
               "    }\r\n" +
               "})(this, function (require, exports) {\r\n" +
               "    \"use strict\""

gulp.task('default', function () {
    return gulp.src('./autocomplete.ts')
        .pipe(ts(tsconfig))
        .pipe(replace(/^(\n|\r|.)+"use strict"/gmi, template))
        .pipe(uglify({
            unsafe: true
        }))
        .pipe(gulp.dest('.'));
});

gulp.task('watch', function() {
    gulp.watch('./autocomplete.ts', ['default']);
});