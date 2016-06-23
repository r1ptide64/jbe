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
    //var doc, err;
    model.findById(id, function (err, doc) {
        //console.log('in getDoc!');
        if (err) {
            console.log('error: ' + err);
            return;
        }
        if (doc == null) {
            doc = new model({ _id: self.id, state: self._state });
            doc.save(function (err, product) {
                if (err) {
                    console.log('error: ' + err);
                }
                else {
                    self.doc = product;
                    self.emit('docReady');
                }
            });
        }   
        else {
            //console.log('doc =' + doc);
            self.doc = doc;
            self.state = doc.state;
            self.emit('docReady');
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
    var _state = initialState;
    self.on('docReady', function () {
        Object.defineProperty(this, 'state', {
            get: function () { return _state; },
            set: function (newVal) {
                if (Object.is(_state, newVal)) return;
                _state = newVal;
                self.emit('command', newState);
                if (Object.is(newVal, doc.state)) return;
                doc.set('state', newVal);
                doc.save();
            }
        });
    });
    getDoc(id, model, self);
    if (mqttOptions.in) {
        client.subscribe(id, function (err) {
            if (err) {
                console.log('MQTT error: ' + err);
            }
            else {
                client.on('message', function (topic, message) {
                    if (topic.search(id) < 0) return;
                    var newState = {};
                    if (model == NumberModel) {
                        newState = Number(message.toString());
                    }
                    else if (model == SwitchModel) {
                        newState = (message.toString() == 'true');
                    }
                    self.emit('mqttIn', newState, self.state);
                    self._state = newState;
                });
            }
        });
    }
    if (mqttOptions.out) {
        self.on('command', function (newState) {
            client.publish(id + '/set', newState);
        });
    }
};
util.inherits(Item, EventEmitter);

var HvacSchema = mongoose.Schema({
    _id: String,
    mode: String,
    setpoint: Number,
    temperature: Number,
    humidity: Number
});
var HvacModel = mongoose.model('hvac', HvacSchema);
HvacModel.mqtt = {
    in: {
            temperature: '/temperature/temperature',
            humidity: '/humidity/humidity'
    },
    out: {}
};

var retTemp = new Item('Temperature', 'home/gf-therm/temperature/temperature', 0, NumberModel, { in: true });
var retSwitch = new Item('Porch Light', 'home/porch-light/light/on', false, SwitchModel, { in: true });

module.exports = {
    switches: [
        new Item('Porch Light', 'home/porch-light/light/on', false, SwitchModel, { out: true }),
        new Item('Porch Light', 'home/lf-bath/light/on', false, SwitchModel, { out: true }),
    ],
    hvac: []
};