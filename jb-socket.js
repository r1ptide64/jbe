var app = require('./app.js');
var items = app.items;

var item2cli = function (item) {
    return {
        id: item.id,
        state: item.state,
        name: item.name
    };
};

var getHvacForCli = function (hvac) {
    var ret = {};
    for (var prop in hvac) {
        ret[prop] = item2cli(hvac[prop]);
    }
    return ret;
};

var cli2item = function (slimItem) {
    var fullAry = items.switches.concat(items.hvac);
    var findItem = function (oneItem) {
        return oneItem.id == slimItem.id
    };
    return fullAry.find(findItem);
};

var connected = function (socket) {
    console.log('socket connection established!');
    var cliData = {
        switches: items.switches.map(item2cli),
        hvac: getHvacForCli(items.hvac)
    };
    console.log('cliData:');
    console.log(cliData);
    socket.emit('init', cliData);
    socket.on('command', function (slimItem) {
        console.log('server received command! slimitem below:');
        console.log(slimItem);
        var fullItem = cli2item(slimItem);
        console.log('fullItem = ' + fullItem);
        fullItem.setState(slimItem.state);
    });
    socket.on('disconnect', function () {
        console.log('socket connection removed!');
    });
};

var retFn = function (server) {
    var io = require('socket.io')(server);

    io.on('connection', connected);
};





module.exports = retFn;