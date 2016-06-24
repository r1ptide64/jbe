var util = require('util');
var mqtt = require('mqtt');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('connected to database!');
});

var client = mqtt.connect('mqtt://192.168.1.200:1883');
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
//            console.log('subscribed to relevant MQTT topics!');
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
    state: Boolean
});
var SwitchModel = mongoose.model('switch', SwitchSchema);

var NumberSchema = mongoose.Schema({
    _id: String,
    state: Number
});
var NumberModel = mongoose.model('number', NumberSchema);

var getDoc = function (id, model, self) {
    var doc, err;
    model.findById(id, function (err, doc) {
        //console.log('in getDoc!');
        if (err) {
            self.emit('err', err);
        }
        else if (doc == null) {
            doc = new model({ _id: self.id, state: self._state });
            doc.save(function (err, product) {
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
            //console.log('doc =' + doc);
            self.doc = doc;
            self.state = doc.state;
            self.emit('docReady');
            return doc;
            //self.get = function () { return self.doc; };
            //self.post = function (updates) { self.doc.set(updates); };
            //self.on('change', self.doc.set('state', newState));
        }
        
    });
};

var EventEmitter = require('events');
var Item = function (name, id, initialState, model, mqttOptions, httpOptions) {
    var self = this;
    EventEmitter.call(self);
    this.name = name;
    this.id = id;
    this.state = initialState;
    this.setState = function (newState, source) {
        self.emit('update', newState, this.state, source);
        if (Object.is(newState, this.state)) return;
        self.emit('change', newState, this.state, source);
        this.state = newState;
    };
    self.once('docReady', function () {
        self.on('update', function (newState, oldState, source) {
            if (source == 'db') return;
            self.doc.state = newState;
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
                    var newState = mqttOptions.in(message);
                    self.setState(newState, 'mqtt');
                });
            }
        });
    }
    if (mqttOptions.out) {
        self.on('change', function (newState, oldState, source) {
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


module.exports = {
    switches: [
        new Item('Porch Light', 'home/porch-light/light/on', false, SwitchModel, backwardsSwitchMQTT),
        new Item('Lower Bathroom Light', 'home/lf-bath/fan/on', false, SwitchModel, backwardsSwitchMQTT),
        new Item('Lower Bathroom Fan', 'home/lf-bath/light/on', false, SwitchModel, forwardsSwitchMQTT),
    ],
        //new Item('Lower Bathroom Light', 'home/lf-bath/fan/on', false, SwitchModel, { out: true, in: true }),
        //new Item('Lower Bathroom Fan', 'home/lf-bath/light/on', false, SwitchModel, { out: true, in: true })
    hvac: []
};