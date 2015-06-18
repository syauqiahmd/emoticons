var optipng = require('optipng-bin');
var path = require('path');
var assert = require('assert');
var fs = require('fs');
var lwip = require('lwip');
var cp = require('child_process');

// Required fields in the manifest
var requiredFields = ['name', 'emoticons'];
// Pattern to match emoticon files
var fileRe = /^[a-zA-Z0-9_-]*$/;
// Maximum emoticon file size
var maxFileSize = 1024 * 50;
// Emoticon file formats
var formats = ['png', 'gif', 'svg'];


/**
 * Validates a directory of emoticons
 * @param  {String} dir
 * @throws {Error} If invalid
 */
exports.validate = function (dir, cb) {
    say('Checking ' + dir);

    var index = path.join(dir, 'index.json');
    var manifest = require('./' + index);
    var allowedFiles = [index];

    requiredFields.forEach(function (name) {
        assert(name in manifest);
    });
    say('Verified manifest', 1);

    say('Checking emoticons', 1);
    Object.keys(manifest.emoticons).forEach(function (code) {
        var file = manifest.emoticons[code];
        assert(fileRe.test(file));
        assert(code.length > 1);

        say('Looking for ' + file, 2);
        var stat = getFormat(path.join(dir, file));
        if (!stat) {
            assert(false);
        }
        say('Discovered ' + stat.file, 2);

        assert(stat.size < maxFileSize);
        allowedFiles.push(stat.file);
    });

    say('Checking for extraneous files', 1);
    fs.readdirSync(dir).forEach(function (file) {
        say('Checking ' + file, 2);
        assert(allowedFiles.indexOf(path.join(dir, file)) !== -1);
    });
};

/**
 * Builds a sprite sheet for the emoticons in the target file (png).
 * Returns a parsed menfiest.
 * @param  {Number} size Size in pixels of each image
 * @param  {String} dir
 * @param  {String} target
 * @param  {Function} callback
 */
exports.spritesheet = function (size, dir, target, callback) {
    say('Rendering pack ' + dir);
    var manifest = require('./' + path.join(dir, 'index.json'));
    var codes = Object.keys(manifest.emoticons);

    var unique = 0;
    var seen = [];
    codes.forEach(function (code) {
        var f = manifest.emoticons[code];
        if (seen.indexOf(f) === -1) {
            seen.push(f);
            unique++;
        }
    });

    var columns = Math.ceil(Math.sqrt(unique));
    var rows = Math.ceil(unique / columns);
    var cached = {};
    var sheet = lwip.create(columns * size, rows * size, function (err, img) {
        if (err) return callback(err);

        /**
         * Adds the emoticon's image to the lwip board.
         * @param {Number} x
         * @param {Number} y
         * @param {lwip} i
         * @param {Function} callback
         */
        function add(file, ext, x, y,callback) {
            lwip.open(file, ext, function (err, i) {
                if (err) return callback(err);
                i.resize(size, size, function (err, i) {
                    if (err) return callback(err);
                    img.paste(x, y, i, callback);
                });
            });
        }

        /**
         * Takes an svg file, and returns a rendered png
         * as a buffer to the callback.
         * @param  {String} file
         * @param {Function} callback
         */
        function grabSvg(file, callback) {
            var p = cp.spawn('rsvg-convert', ['-w', size, '-h', size, file]);
            var bufs = [];
            var stderr = '';
            p.stdout.on('data', function (data) {
                bufs.push(data);
            });

            p.stderr.on('data', function (data) {
                stderr += data;
            });

            p.on('exit', function (code) {
                if (code > 0) {
                    callback(new Error(stderr));
                } else {
                    callback(undefined, Buffer.concat(bufs));
                }
            });
        }

        /**
         * Writes out the sprite sheet.
         * @param  {Function} done
         */
        function done () {
            var tmp = target + '.nomin';
            say('Writing out to ' + tmp, 1);
            img.writeFile(tmp, 'png', function (err) {
                if (err) return callback(err);
                say('Minifying...', 1);
                cp.execFile(optipng, ['-out', target, tmp], function (err) {
                    fs.unlinkSync(tmp);
                    callback(err, manifest);
                });
            });
        }

        /**
         * Recursive function to draw images to the board.
         * @param  {Number}   idx
         */
        (function next (idx, ptr) {
            if (idx >= codes.length) {
                return done();
            }

            var x = size * (ptr % columns);
            var y = size * Math.floor(ptr / columns);

            var code = codes[idx];
            var name = manifest.emoticons[code];
            var stat = getFormat(path.join(dir, name));

            if (name in cached) {
                say('Loading file for `' + code + '` from cache.', 1);
                manifest.emoticons[code] = cached[name];
                return cb();
            }

            manifest.emoticons[code] = cached[name] = { x: x, y: y };
            ptr += 1;

            switch (stat.fmt) {
                case 'svg':
                    say('Rendering ' + stat.file, 1);
                    grabSvg(stat.file, function (err, buf) {
                        if (err) return callback(err);
                        say('Drawing ' + stat.file + ' at (' + x + ', ' + y + ')', 1);
                        add(buf, 'png', x, y, cb);
                    });
                    break;
                default:
                    say('Drawing ' + stat.file + ' at (' + x + ', ' + y + ')', 1);
                    add(stat.file, stat.fmt, x, y, cb);
            }

            function cb (err) {
                if (err) {
                    callback(err);
                } else {
                    next(idx + 1, ptr);
                }
            }
        })(0, 0);
    });
};

/**
 * Determines the format of a file, and returns a stat for it,
 * including the full file path.
 * @param  {String} file
 * @return {Object}
 */
function getFormat (file) {
    for (var i = 0; i < formats.length; i++) {
        var fmt = formats[i];
        var stat;

        try {
            stat = fs.statSync(file + '.' + fmt);
        } catch (e) {
            continue;
        }

        stat.file = file + '.' + fmt;
        stat.fmt = fmt;
        return stat;
    }
}

/**
 * Wrapper around console.log to print a message.
 * @param  {String} msg
 * @param  {Number} [indent]
 */
function say(msg, indent) {
    while (indent) {
        msg = '\t' + msg;
        indent--;
    }
    console.log(msg);
};
