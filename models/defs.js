var Item    = require('./item'),
    Manager = require('./manager'),
    Maps    = require('./maps'),
    app     = require('../app');

var definitions = new Manager();

var mqttRoot = app.isPrd
    ? 'home'
    : 'test';

definitions.insert([
    new Item('porchLight', 'Porch Light', 'switch', false, {
        mqtt: new Maps.BackwardsSwitchMQTT(mqttRoot + '/porch-light/light/on'),
        db  : true
    }),
    new Item('lfbrLight', 'Lower Bathroom Light', 'switch', false, {
        mqtt: new Maps.BackwardsSwitchMQTT(mqttRoot + '/lf-bath/fan/on'),
        db  : true
    }),
    new Item('lfbrFan', 'Lower Bathroom Fan', 'switch', false, {
        mqtt: new Maps.ForwardsSwitchMQTT(mqttRoot + '/lf-bath/light/on'),
        db  : true
    }),
    new Item('temp', 'Temperature', 'hvac', 0, {
        mqtt: new Maps.NumberInMQTT('home/gf-therm/temperature/temperature'),
        db  : true
    }),
    new Item('humid', 'Humidity', 'hvac', 0, {
        mqtt: new Maps.NumberInMQTT('home/gf-therm/humidity/humidity'),
        db  : true
    }),
    new Item('mode', 'Mode', 'hvac', 0, {
        mqtt: false,
        db  : true
    }),
    new Item('setpoint', 'Setpoint (home)', 'hvac', 72.5, {
        mqtt: false,
        db  : true
    }),
    new Item('awaySetpoint', 'Setpoint (away)', 'hvac', 72.5, {
        mqtt: false,
        db: true
    }),
    new Item('comingHome', 'Coming Home', 'hvac', false, {
        mqtt: false,
        db: true
    }),
    new Item('AC', 'AC', 'hvac', false, {
        mqtt: new Maps.ForwardsSwitchMQTT(mqttRoot + '/gf-therm/AC/on'),
        db  : true
    }),
    new Item('heat', 'Heat', 'hvac', false, {
        mqtt: new Maps.ForwardsSwitchMQTT(mqttRoot + '/gf-therm/heat/on'),
        db  : true
    }),
    new Item('blowing', 'Blowing', 'hvac', false, {
        mqtt: false,
        db  : true
    }),
    new Item('josh', 'Josh', 'presence', 'Unknown', {
        mqtt: new Maps.OwntracksWaypoint('joeb'),
        db  : true
    }),
    new Item('chelsea', 'Chelsea', 'presence', 'Unknown', {
        mqtt: new Maps.OwntracksWaypoint('wheezy'),
        db  : true
    })
]);

module.exports = definitions;