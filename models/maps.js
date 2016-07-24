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

module.exports.NumerInMQTT = function (topicIn) {
    this.out = false;
    this.in = {};

    this.in.topic = topicIn;
    this.in.fn = function (message) {
        return Number(message.toString());
    };
};