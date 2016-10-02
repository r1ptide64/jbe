var mqtt = require('mqtt');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('jbe:mqtt');

var mosquittoServers = {
    laptop: 'mqtt://127.0.0.1:1883',
    desktop: 'mqtt://192.168.1.200:1883'
};
var client = mqtt.connect(mosquittoServers.desktop);
client.on('error', console.error.bind(console, 'MQTT error: '));

function MQTT(item, options) {
    if (!item || !options) return;

    if (options.in) {
        if (!Array.isArray(options.in)) {
            options.in = [options.in];
        }
        options.in.forEach(function (oneOption) {
            client.subscribe(oneOption.topic, function (err) {
                if (err) {
                    item.emit('error', err);
                    return;
                }
                client.on('message', function (topic, message) {
                    if (topic !== oneOption.topic) return;
                    debug('MQTT update on ' + item.name);
                    var newState = oneOption.fn(message);
                    item.setState(newState, 'mqtt');
                })
            })
        });
    }
    if (options.out) {
        if (!Array.isArray(options.out)) {
            options.out = [options.out];
        }
        options.out.forEach(function (oneOption) {
            item.on('update', function (newState, oldState, source) {
                if (source === 'mqtt') return;
                client.publish(oneOption.topic, oneOption.fn(newState));
            })
        });
    }
};

module.exports = MQTT;