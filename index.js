const fs = require('fs');
const output = module.exports = {};

fs.readdirSync(__dirname).map(dir => {
    const path = __dirname + '/' + dir;
    const index = path + '/index.json';

    if (fs.existsSync(index)) {
        output[dir] = require(index);
        output[dir].path = path;
    }
});
