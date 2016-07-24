var util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('jbe:item');
var MQTT = require('./mqtt.js');
var DB = require('./db.js');

function Item(id, name, type, initialState, options) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.state = initialState;

    var now = Date.now();
    this.lastUpdate = now;
    this.lastChange = now;

    EventEmitter.call(this);

    if (!options) return;
    if (options.mqtt) MQTT(this, options.mqtt);
    if (options.db) DB(this);
};

util.inherits(Item, EventEmitter);

Item.prototype.setState = function (newState, source) {
    debug('setting state on ' + this.name + ', newState = ' + newState);
    var now = Date.now();
    var oldState = this.state;
    this.state = newState;
    this.lastUpdate = now;
    this.emit('update', newState, oldState, source);
    if (newState === oldState) return;
    this.lastChange = now;
    this.emit('change', newState, oldState, source);
};

module.exports = Item;