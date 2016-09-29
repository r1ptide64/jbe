var debug = require('debug')('jbe:pinger');
var os    = require('os');
var exec  = require('child_process').exec;

const PING_INTERVAL = 30 * 1000;
const NUM_REQUESTS  = 3;

var REGEX_PATTERN, COUNT_FLAG;
switch (os.platform()) {
    case 'win32':
        REGEX_PATTERN = /Destination host unreachable./;
        COUNT_FLAG    = '-n';
        break;
    case 'linux':
        REGEX_PATTERN = /0 received,/;
        COUNT_FLAG    = '-c';
        break;
    default:
        throw new Error('Unsupported OS platform.');
        break;
}

const setPingInterval = function setPingInterval(item, ipAddr) {
    var command = `ping ${COUNT_FLAG} ${NUM_REQUESTS} ${ipAddr}`;
    debug(`establishing ping listener on ${item.name}...`);
    var timeout;
    (function ping() {
        debug(`executing ping on ${item.name}`);
        exec(command, (err, stdout) => {
            if (err && err.code !== 1) {
                item.emit(err);
                return;
            }
            var loc = REGEX_PATTERN.test(stdout)
                ? 'Away'
                : 'Home';
            debug(`ping completed on ${item.name}, result: ${loc}`);
            item.setState(loc, 'ping');
        });
        if (timeout !== undefined) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(ping, PING_INTERVAL);
    })();

};

module.exports = setPingInterval;