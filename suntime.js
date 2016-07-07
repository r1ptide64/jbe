var SunCalc = require('suncalc');
var schedule = require('node-schedule');
var app = require('./app.js');
var debug = require('debug')('jbe:suntime');


var sunFunction = function (newState) {
    var debugStr = 'The sun has ';
    debugStr += newState ?
        'set.' :
        'risen.';
    debug(debugStr);
    app.items.switches.porchLight.setState(newState, 'suntime');
};
var recalcSunset = function () {
    debug('recalculating sun times!');
    var times = SunCalc.getTimes(Date.now(), 43.003852, -89.5107942);
    debug('times = ' + JSON.stringify(times));
    var j1 = schedule.scheduleJob(times.sunrise, function () { sunFunction(false); });
    var j2 = schedule.scheduleJob(times.sunset, function () { sunFunction(true); });
};

var j0 = schedule.scheduleJob('5 0 * * *', recalcSunset);
recalcSunset();
debug('set sun recalculating job!');