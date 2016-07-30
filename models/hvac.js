var app   = require('../app'),
    debug = require('debug')('jbe:hvac');

var isPrd = app.isPrd;
var hvac = app.manager.items.hvac;

const MIN_CYCLE_LENGTH = isPrd
    ? 5 * 60 * 1000
    : 20 * 1000;
const TEMP_WINDOW = 1;

var processTemperatureChange = function () {
    var setpoint = hvac.setpoint.state;
    var currTemp = hvac.temp.state;
    var currMode = hvac.mode.state;
    var blowing = hvac.blowing;
    if (setpoint === undefined || currTemp === undefined) {
        console.error('critical value undefined!');
        return;
    }
    var diff = currTemp - setpoint;
    debug('diff = ' + diff);
    var desiredState = undefined;
    if (currMode === undefined || currMode === 0) {  // off/uninitiated
        debug('system off/uninitiated, done.');
        desiredState = false;
    }
    else if (Date.now() - blowing.lastChange >= MIN_CYCLE_LENGTH) {
        if (diff <= -TEMP_WINDOW) {
            debug('temp is low');
            desiredState = (currMode === 1); // heat mode?
        }
        else if (diff >= TEMP_WINDOW) {
            debug('temp is high');
            desiredState = (currMode !== 1); // heat mode?
        }
        else {
            debug('temp is just right');
        }
    }
    else {
        debug('started/stopped blowing recently.');
    }
    if (desiredState === undefined) {
        debug('no change necessary, exiting.');
        return;
    }
    blowing.setState(desiredState, 'hvac');
};

hvac.temp.on('update', processTemperatureChange);
hvac.setpoint.on('update', processTemperatureChange);
hvac.mode.on('update', processTemperatureChange);

hvac.blowing.on('update', function (newState) {
    var debug = require('debug')('jbe:blowing');
    var currMode = hvac.mode.state;
    var ac = hvac.AC;
    var heat = hvac.heat;
    switch (currMode) {
        case 1:
            debug('heat mode, turning heat to ' + newState);
            heat.setState(newState, 'hvac');
            ac.setState(false, 'hvac');
            break;
        case 2:
            debug('AC mode, turning AC to ' + newState);
            ac.setState(newState, 'hvac');
            heat.setState(false, 'hvac');
            break;
        default:
            debug('turning everything off.');
            ac.setState(false, 'hvac');
            heat.setState(false, 'hvac');
    }
});