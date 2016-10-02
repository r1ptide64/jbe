var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var debug        = require('debug')('jbe:item');
var MQTT         = require('./mqtt.js');
var DB           = require('./db.js');
var Ping         = require('./pinger');

function Item(id, name, type, initialState, options) {
    this.id    = id;
    this.name  = name;
    this.type  = type;
    this.state = initialState;

    var now         = Date.now();
    this.lastUpdate = now;
    this.lastChange = now;

    EventEmitter.call(this);

    if (!options) return;
    if (options.mqtt) MQTT(this, options.mqtt);
    if (options.db) DB(this);
    if (options.ping) Ping(this, options.ping);
};

util.inherits(Item, EventEmitter);

Item.prototype.setState = function (newState, source) {
    debug('setting state on ' + this.name + ', newState = ' + newState);
    var now         = Date.now();
    var oldState    = this.state;
    this.state      = newState;
    this.lastUpdate = now;
    this.emit('update', newState, oldState, source);
    if (newState === oldState) return;
    this.lastChange = now;
    this.emit('change', newState, oldState, source);
};

Item.prototype.toJSON = function () {
    return {
        id: this.id,
        name: this.name,
        type: this.type,
        lastUpdate: this.lastUpdate,
        lastChange: this.lastChange,
        state: this.state
    };
}

module.exports = Item;