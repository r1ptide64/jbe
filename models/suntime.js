var SunCalc  = require('suncalc');
var schedule = require('node-schedule');
var app      = require('../app');
var isPrd    = true; //app.get('env') === 'production';
var debug    = require('debug')('jbe:suntime');


var sunFunction = function (newState) {
    var debugStr = 'The sun has ';
    debugStr += newState
        ?
                'set.'
        :
                'risen.';
    debug(debugStr);
    app.manager.items.switch.porchLight.setState(newState, 'suntime');
    //app.manager.items.switch.xmasLight.setState(newState, 'suntime');
};

function CalculateSunset() {
    debug('recalculating sun times!');
    var times = isPrd
        ? SunCalc.getTimes(Date.now(), 43.003852, -89.5107942)
        : {
        sunrise: new Date(Date.now() + 5 * 1000),
        sunset : new Date(Date.now() + 10 * 1000)
    };
    debug('times = ' + JSON.stringify(times));
    schedule.scheduleJob(times.sunrise, sunFunction.bind(sunFunction, false));
    schedule.scheduleJob(times.sunset, sunFunction.bind(sunFunction, true));
};

var cronStr = isPrd
    ? '0 2 * * *'
    : '*/20 * * * * *';


schedule.scheduleJob(cronStr, CalculateSunset);
CalculateSunset();
debug('set sun recalculating job!');
