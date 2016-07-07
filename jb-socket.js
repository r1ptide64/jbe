var app = require('./app.js');
var debug = require('debug')('jbe:socket');
var items = app.items;

var item2cli = function (item) {
    return {
        id: item.id,
        state: item.state,
        name: item.name
    };
};

var getCliData = function () {
    var ret = {};
    Object.keys(items).forEach(function (itemType) {
        ret[itemType] = {};
        Object.keys(items[itemType]).forEach(function (itmIndx) {
            ret[itemType][itmIndx] = item2cli(items[itemType][itmIndx]);
        });
    });
    return ret;
};

var getHvacForCli = function (hvac) {
    var ret = {};
    for (var prop in hvac) {
        ret[prop] = item2cli(hvac[prop]);
    }
    return ret;
};

var cli2item = function (slimItem) {
    var findItem = function (oneItem) {
        return oneItem.id == slimItem.id;
    };
    for (var itemClass in items) {
        //Object.keys(items).forEach(function (itemClass) {
        for (var itmIndx in items[itemClass]) {
        //Object.keys(items[itemClass]).forEach(function (itmIndx) {
            var ret = items[itemClass][itmIndx];
            if (findItem(ret)) return ret;
        }
    }
    return undefined;
    //var ret = items.switches.find(findItem);
    //if (ret != undefined) return ret;
    //for (var prop in items.hvac) {
    //    ret = items.hvac[prop];
    //    if (findItem(ret)) return ret;
    //}
    //return undefined;
};

var connected = function (socket) {
    debug('socket connection established! id: ' + socket.id);
    var cliData = getCliData();
    debug('cliData:');
    debug(cliData);
    socket.emit('init', cliData);
    socket.on('command', function (slimItem) {
        debug('server received command! slimitem below:');
        debug(slimItem);
        var fullItem = cli2item(slimItem);
        if (fullItem == undefined) {
            debug("unable to find item: " + slimItem);
            return;
        }
        debug('fullItem = ' + JSON.stringify(fullItem, null, '\t'));
        fullItem.setState(slimItem.state, 'socket');
    });
    socket.on('disconnect', function () {
        debug('socket connection removed!');
    });
};

var retFn = function (server) {
    var io = require('socket.io')(server);
    Object.keys(items).forEach(function (itemType) {
        Object.keys(items[itemType]).forEach(function (itmIndx) {
            var theItem = items[itemType][itmIndx];
            theItem.on('change', function (newState, oldState, source) {
                debug('got a change from ' + theItem.id + '! newState = ' + newState + ', oldState = ' + oldState);
                io.emit('change', {
                    id: theItem.id,
                    state: newState
                });
            });
        });
    });
    io.on('connection', connected);
};

//    items.switches.forEach(function (theSwitch) {
//        theSwitch.on
//    });

//    for (var prop in items.hvac) {
//        var theItem = items.hvac[prop];
//        theItem.on('change', function (newState, oldState, source) {
//            //if (source == 'socket') return;
//            debug('emitting change on prop ' + prop + ' (below)');
//            debug(JSON.stringify(theItem, null, '\t'));
//            io.emit('change', {
//                id: theItem.id,
//                state: newState
//            });
//        });
//    }
    
//};





module.exports = retFn;