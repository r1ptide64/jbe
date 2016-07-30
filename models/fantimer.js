var app   = require('../app'),
    debug = require('debug')('jbe:fantimer');

var isPrd = app.get('env') === 'production';
var fan = app.manager.items.switch.lfbrFan;
var timer;

var FAN_TIMEOUT = isPrd
    ? 1000 * 60 * 20
    : 20 * 1000;

fan.on('change', function (newState) {
    debug('lfbr fan changed');
    if (newState === false) return;
    debug('lfbr fan turned on');
    if (timer !== undefined) {
        clearTimeout(timer);
        debug('timeout cleared');
    }
    timer = setTimeout(fan.setState.bind(fan, false, 'timer'), FAN_TIMEOUT);
});