var Item    = require('./item'),
    Manager = require('./manager'),
    Maps    = require('./maps');

var definitions = new Manager();

var mqttRoot = 'test';

definitions.insert([
    new Item('porchLight', 'Porch Light', 'switch', false, {
        mqtt: new Maps.BackwardsSwitchMQTT('home/porch-light/light/on'),
        db  : true
    }),
    new Item('lfbrLight', 'Lower Bathroom Light', 'switch', false, {
        mqtt: new Maps.BackwardsSwitchMQTT('home/lf-bath/fan/on'),
        db  : true
    }),
    new Item('lfbrFan', 'Lower Bathroom Fan', 'switch', false, {
        mqtt: new Maps.ForwardsSwitchMQTT('home/lf-bath/light/on'),
        db  : true
    }),
    new Item('temp', 'Temperature', 'hvac', 0, {
        mqtt: new Maps.NumerInMQTT('home/gf-therm/temperature/temperature'),
        db  : true
    }),
    new Item('humid', 'Humidity', 'hvac', 0, {
        mqtt: new Maps.NumerInMQTT('home/gf-therm/humidity/humidity'),
        db  : true
    }),
    new Item('mode', 'Mode', 'hvac', 0, {
        mqtt: false,
        db  : true
    }),
    new Item('setpoint', 'Setpoint', 'hvac', 72.5, {
        mqtt: false,
        db  : true
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
    })
]);

module.exports = definitions;