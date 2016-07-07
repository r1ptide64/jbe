var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('test.js');
var util = require('util');

var TestEmitter = function (initialState, name) {
    var self = this;
    EventEmitter.call(self);
    this.state = initialState;
    this.name = name;
    this.setState = function (newState) {
        self.emit('change', newState, this.state);
        self.state = newState;
    };
};
util.inherits(TestEmitter, EventEmitter);

var myObj = {
    ary: [new TestEmitter(false, 'ary1'), new TestEmitter(true, 'ary2')],
    named: {
        name1: new TestEmitter(3, 'name1'),
        name2: new TestEmitter(4, 'name2')
    }
};

var chelsea = { age: 0, height: 1, sex: 2};

myObj.ary.forEach(function (aryEmitter) {
    aryEmitter.on('change', function (newState) {
        debug(aryEmitter.name + ' changed to: ' + newState);
    });
});

var dumpStateToConsole = function (theEmitter,newState) { };

for (var prop in myObj.named) {
//Object.keys(myObj.named).forEach(function (prop) {
    var currEmitter = myObj.named[prop];
    debug('prop = ' + prop);
    debug('name = ' + currEmitter.name);
    currEmitter.on('change', dumpStateToConsole
    //currEmitter.on('change', function (newState) {
    //    debug(currEmitter.name + ' changed to: ' + newState);
    //});
}

myObj.ary[0].setState(true);
myObj.ary[1].setState(false);
myObj.named.name1.setState(4);
myObj.named.name2.setState(5);

for (var i in [0, 1, 2, 3, 4]) {
    var tmp = i + 10;
    debug('tmp = ' + tmp);
}