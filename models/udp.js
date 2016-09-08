var dgram = require('dgram'),
    debug = require('debug')('jbe:udp'),
    app   = require('../app');

module.exports = function () {

}
var server     = dgram.createSocket('udp4');

server.on('error', (err) => {
    debug('udp error: %s', err);
    server.close();
});

server.on('message', (msg, rinfo) => {
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

server.on('listening', () => {
    var address = server.address();
    debug(`server listening ${address.address}:${address.port}`);
});

server.bind(3829);