var IO      = require('socket.io'),
    debug   = require('debug')('jbe:socket'),
    manager = require('./defs');

function Socket(server) {
    debug('socket server established.');
    var io = IO(server);
    // manager.on('change', io.emit.bind(io, 'change'));
    manager.on('castUpdate', io.emit.bind(io, 'castUpdate'));
    io.on('connection', onConnection);
};

function onConnection(socket) {
    debug('socket connection established! id: ' + socket.id);
    // var tmpCliData = items.dumpToClient();
    debug(JSON.stringify(manager.items));
    // debug(JSON.stringify(items.items.cc));
    // debug(JSON.stringify(tmpCliData, null, '\t'));
    socket.emit('init', manager.items);//JSON.stringify(manager.items));
    socket.on('command', (slimItem) => {
        manager.processCmd(slimItem);
    });
    socket.on('castCmd', (cmdData) => {
        debug('received cast command!');
        debug(JSON.stringify(cmdData, null, '\t'));
        manager.castCmd(cmdData);
    });
    socket.on('disconnect', () => {
        debug('socket connection removed.');
    });
}
module.exports = Socket;