var debug = require('debug')('jbe:maps');

module.exports.BackwardsSwitchMQTT = function (topicIn, topicOut) {
    topicOut = (topicOut !== undefined)
        ? topicOut
        : topicIn + '/set';

    this.in = {};
    this.out = {};

    this.in.topic = topicIn;
    this.in.fn = function (message) {
        return (message.toString() == 'false');
    };

    this.out.topic = topicOut;
    this.out.fn = function (state) {
        return (!state).toString();
    };
};

module.exports.OwntracksWaypoint = function (uid) {
    this.in = {};
    this.in.topic = 'owntracks/' + uid + '/phone/event';
    this.in.fn = function (message) {
        var payload = JSON.parse(message);
        debug('owntracks waypoint: ' + JSON.stringify(message));
        var retVal = 'Unknown';
        if (payload._type === 'transition') {
            if (payload.event === 'enter') {
                retVal = payload.desc;
            }
        }
        return retVal;
    };
};

module.exports.ForwardsSwitchMQTT = function (topicIn, topicOut) {
    topicOut = (topicOut !== undefined)
        ? topicOut
        : topicIn + '/set';

    this.in = {};
    this.out = {};

    this.in.topic = topicIn;
    this.in.fn = function (message) {
        return (message.toString() == 'true');
    };

    this.out.topic = topicOut;
    this.out.fn = function (state) {
        return (state).toString();
    };
};

module.exports.NumberInMQTT = function (topicIn) {
    this.out = false;
    this.in = {};

    this.in.topic = topicIn;
    this.in.fn = function (message) {
        return Number(message.toString());
    };
};