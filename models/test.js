var Item = require('./item');
var debug = require('debug')('jbe:test');
var util = require('util');
var EventEmitter = require('events');

function TestClass() {
    this.propOne = 3;
    this.poo = 'pee';
    this.methodOne = function () {
        debug('methodOne, this = ' + JSON.stringify(this));
    }
    // this.Speak('constructing!');
    // Item.call(this, 'poo', 'pee', 'poopee', false);
    // this.newProp = 'bacon';
    // this.on('testEvent', (msg) => debug(msg));
}
TestClass.prototype.methodTwo = function () {
    debug('methodTwo, this = ' + JSON.stringify(this));
}

var testInstance = new TestClass();
testInstance.methodOne();
testInstance.methodTwo();
// testInstance.Speak('done constructing!');
// debug('testInstance: ' + JSON.stringify(testInstance));
// testInstance.emit('testEvent', 'test message!');