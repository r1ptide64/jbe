var debug = require('debug')('jbe:test');
var util = require('util');
var EventEmitter = require('events');

function SuperCtor() {
    this.x = 25;
}

function Ctor() {
    this.y = 10;
}

util.inherits(Ctor, SuperCtor);

var tmp = new Ctor();
debug(tmp instanceof Ctor);
debug(tmp instanceof SuperCtor);

// function TestBrowser() {
//     debug('constructing browser!');
//     this.count = 0;
//     EventEmitter.call(this);
// }
// util.inherits(TestBrowser, EventEmitter);
//
// TestBrowser.prototype.start = function () {
//     debug('TestBrowser started!');
//     this.interval = setInterval(() => {
//         this.count++;
//         debug('count = ' + this.count);
//         if (this.count >= 3) {
//             this.emit('error', 'BIGBUTTS');
//         }
//     }, 2500);
// };
//
// function TestManager() {
//     this.x = 1;
//     function pewp() {
//         this.x = 10;
//     }
//     setupBrowser.call(this);
// }
//
// TestManager.prototype.onBrowserError = function (err) {
//     debug('manager heard about browser\'s error: ' + err);
//     clearInterval(this.browser.interval);
//     delete this.browser;
//     setupBrowser.call(this);
// };
//
// function setupBrowser() {
//     debug('setting up browser!');
//     this.browser = new TestBrowser();
//     this.browser.once('error', this.onBrowserError.bind(this));
//     this.browser.start();
// }
//
// var tmp = new TestManager();
// setTimeout(tmp.pewp, 1500);