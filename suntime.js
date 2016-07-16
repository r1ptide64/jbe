var SunCalc = require('suncalc');
var schedule = require('node-schedule');
var app = require('./app.js');
var isPrd = app.get('env') === 'production';
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
    var times = isPrd
        ? SunCalc.getTimes(Date.now(), 43.003852, -89.5107942)
        : {
            sunrise: new Date(Date.now() + 5*1000),
            sunset: new Date(Date.now() + 10*1000)
    };
    debug('times = ' + JSON.stringify(times));
    var j1 = schedule.scheduleJob(times.sunrise, function () { sunFunction(false); });
    var j2 = schedule.scheduleJob(times.sunset, function () { sunFunction(true); });
};

var cronStr = isPrd
    ? '0 2 * * *'
    : '*/20 * * * * *';

var j0 = schedule.scheduleJob(cronStr, recalcSunset);
recalcSunset();
debug('set sun recalculating job!');