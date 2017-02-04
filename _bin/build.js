#!/usr/bin/env node

const processing = require('../processing');
const path = require('path');
const fs = require('fs');
const rm = require('rimraf');

const tasks = {
    /**
     * Runs tests on the target dir(s) to ensure the packs look
     * like they're valid.
     */
    test (targets, argv) {
        targets.forEach(processing.validate);
    },
    /**
     * Builds sprite sheets for pack(s) and a manifest, outputting
     * to the --output dir.
     */
    build (targets, argv) {
        const manifest = {};
        const todo = targets.length;

        const dest = argv.build;
        const size = parseInt(argv.size, 10) || 16;

        rm.sync(dest);
        fs.mkdirSync(dest);

        (function next (idx) {
            if (idx >= targets.length) {
                return fs.writeFileSync(
                    path.join(dest, 'manifest.json'),
                    JSON.stringify(manifest)
                );
            }

            const target = targets[idx];
            const file = path.join(dest, target + '.png');

            processing.spritesheet(size, target, file, (err, m) => {
                if (err) throw err;
                manifest[target] = m;
                next(idx + 1);
            });
        })(0);
    }
};

function resolveTargets (argv) {
    const target = argv._[0];
    if (argv.recursive) {
        return fs.readdirSync(target).map(dir => path.join(target, dir))
        .filter(dir => fs.existsSync(path.join(dir, 'index.json')));
    }
    return [target];
}

const argv = require('minimist')(process.argv.slice(2));
for (let key in argv) {
    if (key in tasks) {
        tasks[key](resolveTargets(argv), argv);
    }
}
