var fs = require('fs');
var output = module.exports = {};

fs.readdirSync(__dirname).map(dir => {
    var path = __dirname + '/' + dir;
    var index = path + '/index.json';

    if (fs.existsSync(index)) {
        output[dir] = require(index);
        output[dir].path = path;
    }
});
