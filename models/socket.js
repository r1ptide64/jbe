var IO    = require('socket.io'),
    debug = require('debug')('jbe:socket'),
    items = require('./defs');

function Socket(server) {
    debug('socket server established.');
    var io = IO(server);
    items.on('change', io.emit.bind(io, 'change'));
    io.on('connection', onConnection);
};

function onConnection(socket) {
    debug('socket connection established! id: ' + socket.id);
    var tmpCliData = items.dumpToClient();
    debug(JSON.stringify(tmpCliData, null, '\t'));
    socket.emit('init', tmpCliData);
    socket.on('command', (slimItem) => {
        items.processCmd(slimItem);
    });
    socket.on('disconnect', () => {
        debug('socket connection removed.');
    });
}
module.exports = Socket;