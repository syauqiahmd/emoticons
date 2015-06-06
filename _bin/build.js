#!/usr/bin/env node

var processing = require('../processing');
var path = require('path');
var fs = require('fs');
var rm = require('rimraf');

var tasks = {
    /**
     * Runs tests on the target dir(s) to ensure the packs look
     * like they're valid.
     */
    test: function (targets, argv) {
        targets.forEach(processing.validate);
    },
    /**
     * Builds sprite sheets for pack(s) and a manifest, outputting
     * to the --output dir.
     */
    build: function (targets, argv) {
        var manifest = {};
        var todo = targets.length;

        var dest = argv.build;
        var size = parseInt(argv.size, 10) || 16;

        rm.sync(dest);
        fs.mkdirSync(dest);

        (function next (idx) {
            var target = targets[idx];
            var file = path.join(dest, target + '.png');

            processing.spritesheet(size, target, file, function (err, m) {
                if (err) throw err;
                manifest[target] = m;

                if (idx < targets.length - 1) {
                    next(idx + 1);
                } else {
                    fs.writeFileSync(
                        path.join(dest, 'manifest.json'),
                        JSON.stringify(manifest)
                    );
                }
            });

        })(0);
    }
};

function resolveTargets (argv) {
    var target = argv._[0];
    if (argv.recursive) {
        return fs.readdirSync(target).map(function (dir) {
            return path.join(target, dir);
        }).filter(function (dir) {
            return fs.existsSync(path.join(dir, 'index.json'))
        });
    } else {
        return [target];
    }
}

(function () {
    var argv = require('minimist')(process.argv.slice(2));
    for (var key in argv) {
        if (key in tasks) {
            tasks[key](resolveTargets(argv), argv);
        }
    }
})();
