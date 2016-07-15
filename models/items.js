var util = require('util');
var mqtt = require('mqtt');
var mongoose = require('mongoose');
var debug = require('debug')('jbe:items');

var connectToDB = function () {
    mongoose.connect('mongodb://127.0.0.1:27017/test');
}
connectToDB();
var RECONNECT_PERIOD = 1000*10;
var db = mongoose.connection;
var reconnect = undefined;
db.on('error', function (error) {
    console.error('connection error: ' + error);
    if (!Object.is(reconnect, undefined)) {
        clearInterval(reconnect);
    }
    reconnect = setInterval(connectToDB, RECONNECT_PERIOD);
});
db.once('open', function () {
    if (!Object.is(reconnect, undefined)) {
        clearInterval(reconnect);
    }
    debug('connected to database!');
});

var mosquittoServers = {
    laptop: 'mqtt://127.0.0.1:1883',
    desktop: 'mqtt://192.168.1.200:1883'
};
var client = mqtt.connect(mosquittoServers.desktop);
client.on('error', function (error) {
    console.error('MQTT error: ' + error);
});

//client.on('connect', function () {
//    var topics = [
//        'home/gf-therm/humidity/humidity',
//        'home/gf-therm/temperature/temperature',
//        'home/+/+/on'
//    ];
//    client.subscribe(topics, function (err, granted) {
//        if (err) {
//            console.error(err);
//        }
//        else {
//            debug('subscribed to relevant MQTT topics!');
//        }
//    });
//});

//var ItemSchema = mongoose.Schema({
//    _id: String,
//    state: mongoose.Schema.Types.Mixed,
//});
//var ItemModel = mongoose.model('item', ItemSchema);

var SwitchSchema = mongoose.Schema({
    _id: String,
    state: Boolean,
    lastChange: Date,
    lastUpdate: Date
});
var SwitchModel = mongoose.model('switch', SwitchSchema);

var NumberSchema = mongoose.Schema({
    _id: String,
    state: Number,
    lastChange: Date,
    lastUpdate: Date
});
var NumberModel = mongoose.model('number', NumberSchema);

var getDoc = function (id, model, self) {
    var doc, err;
    model.findById(id, function (err, doc) {
        //debug('in getDoc!');
        if (err) {
            self.emit('err', err);
        }
        else if (doc == null) {
            doc = new model({
                _id: self.id,
                state: self.state,
                lastUpdate: self.lastUpdate,
                lastChange: self.lastChange
            });
            doc.save(function saveDoc(err, product) {
                if (err) {
                    self.emit('err', err);
                }
                else {
                    self.doc = product;
                    self.emit('docReady');
                    return product;
                }
            });
        }   
        else {
            //debug('doc =' + doc);
            self.doc = doc;
            self.state = doc.state;
            self.lastUpdate = doc.lastUpdate;
            self.lastChange = doc.lastChange;
            self.emit('docReady');
            return doc;
            //self.get = function () { return self.doc; };
            //self.post = function (updates) { self.doc.set(updates); };
            //self.on('change', self.doc.set('state', newState));
        }
        
    });
};

const EventEmitter = require('events').EventEmitter;
var Item = function (name, id, initialState, model, mqttOptions, httpOptions) {
    var self = this;
    EventEmitter.call(self);
    this.name = name;
    this.id = id;
    this.state = initialState;
    var now = Date.now();
    this.lastUpdate = now;
    this.lastChange = now;
    this.setState = function (newState, source) {
        var now = Date.now();
        var oldState = this.state;
        this.state = newState;
        this.lastUpdate = now;
        self.emit('update', newState, oldState, source);
        if (Object.is(newState, oldState)) return;
        this.lastChange = now;
        self.emit('change', newState, oldState, source);
    };
    self.once('docReady', function () {
        self.on('update', function (newState, oldState, source) {
            if (source === 'db') return;
            var now = Date.now();
            self.doc.lastUpdate = now;
            if (!Object.is(newState, oldState)) {
                self.doc.lastChange = now;
                self.doc.state = newState;
            }
            self.doc.save(function (err) {
                if (err) {
                    self.emit('err', err);
                }
            });
        });
    });
    this.doc = getDoc(id, model, self);
    if (mqttOptions.in) {
        client.subscribe(id, function (err) {
            if (err) {
                self.emit('err', err);
            }
            else {
                client.on('message', function (topic, message) {
                    if (topic.search(id) < 0) return;
                    debug('new MQTT update on this object: ' + JSON.stringify(self, null, '\t'));
                    var newState = mqttOptions.in(message);
                    self.setState(newState, 'mqtt');
                });
            }
        });
    }
    if (mqttOptions.out) {
        self.on('update', function (newState, oldState, source) {
            if (source == 'mqtt') return;
            client.publish(id + '/set', mqttOptions.out(newState));
        });
    }

};
util.inherits(Item, EventEmitter);

//var HvacSchema = mongoose.Schema({
//    _id: String,
//    mode: String,
//    setpoint: Number,
//    temperature: Number,
//    humidity: Number
//});
//var HvacModel = mongoose.model('hvac', HvacSchema);
//HvacModel.mqtt = {
//    in: {
//            temperature: '/temperature/temperature',
//            humidity: '/humidity/humidity'
//    },
//    out: {}
//};

//var retTemp = new Item('Temperature', 'home/gf-therm/temperature/temperature', 0, NumberModel, { in: true });
//var retSwitch = new Item('Porch Light', 'home/porch-light/light/on', false, SwitchModel, { in: true });

var backwardsSwitchMQTT = {
    out: function (state) {
        return (!state).toString();
    },
    in: function (message) {
        return (message.toString() == 'false');
    }
};

var forwardsSwitchMQTT = {
    out: function (state) {
        return (state).toString();
    },
    in: function (message) {
        return (message.toString() == 'true');
    }
};
var numberInMQTT = {
    out: false,
    in: function (message) {
        return Number(message.toString());
    }
};

var presenceInMQTT = {
    out: false,
    in: function (message) {

    }
};

var retObj =  {
    switches: {
        porchLight: new Item('Porch Light', 'home/porch-light/light/on', false, SwitchModel, backwardsSwitchMQTT),
        lfbrLight: new Item('Lower Bathroom Light', 'home/lf-bath/fan/on', false, SwitchModel, backwardsSwitchMQTT),
        lfbrFan: new Item('Lower Bathroom Fan', 'home/lf-bath/light/on', false, SwitchModel, forwardsSwitchMQTT),
    },
    hvac: {
        temp: new Item('Temperature', 'home/gf-therm/temperature/temperature', 1, NumberModel, numberInMQTT),
        humid: new Item('Humidity', 'home/gf-therm/humidity/humidity', 1, NumberModel, numberInMQTT),
        mode: new Item('Mode', 'mode', 0, NumberModel, { in: false, out: false }),
        setpoint: new Item('Setpoint', 'setpoint', 65, NumberModel, { in: false, out: false }),
        AC: new Item('AC', 'home/gf-therm/AC/on', false, SwitchModel, forwardsSwitchMQTT),
        heat: new Item('Heat', 'home/gf-therm/heat/on', false, SwitchModel, forwardsSwitchMQTT),
        blowing: new Item('Blowing', 'blowing', false, SwitchModel, { in: false, out: false })
    },
    cc: {

    }
};

const MIN_CYCLE_LENGTH = 20*1000;
const TEMP_WINDOW = 1;

var processTemperatureChange = function () {
    var debug = require('debug')('jbe:tempChange');
    var setpoint = retObj.hvac.setpoint.state;
    var currTemp = retObj.hvac.temp.state;
    var currMode = retObj.hvac.mode.state;
    var blowing = retObj.hvac.blowing;
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
    if (Date.now() - blowing.lastChange >= MIN_CYCLE_LENGTH) {
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

retObj.hvac.temp.on('update', processTemperatureChange);
retObj.hvac.setpoint.on('update', processTemperatureChange);
retObj.hvac.mode.on('update', processTemperatureChange);

retObj.hvac.blowing.on('update', function (newState) {
    var debug = require('debug')('jbe:blowing');
    var currMode = retObj.hvac.mode.state;
    var ac = retObj.hvac.AC;
    var heat = retObj.hvac.heat;
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

var fanTimer = undefined;
const FAN_TIMEOUT = 1000 * 60 * 20;

retObj.switches.lfbrFan.on('change', function (newState) {
    debug('lfbr fan changed');
    if (newState === false) return;
    debug('lfbr fan turned on');
    if (!Object.is(fanTimer, undefined)) {
        clearTimeout(fanTimer);
        debug('timeout cleared');
    }
    fanTimer = setTimeout(retObj.switches.lfbrFan.setState.bind(retObj.switches.lfbrFan, false, 'timer'), FAN_TIMEOUT);
});

module.exports = retObj;