var Item         = require('./item.js'),
    util         = require('util'),
    EventEmitter = require('events').EventEmitter,
    debug        = require('debug')('jbe:manager');

function Manager() {
    this.items = {};
    EventEmitter.call(this);
}
util.inherits(Manager, EventEmitter);

Manager.prototype.insert = function (items) {
    if (!Array.isArray(items)) {
        items = [items];
    }

    items.forEach((item) => {
        // validate input
        if (!item || !item.type || !item.id) return;

        // create node for this item type if new
        this.items[item.type] = this.items[item.type] || {};

        // do the insertion
        this.items[item.type][item.id] = item;

        // register change listener
        item.on('change', (newState, oldState, source) => {
            this.emit('change', {
                id    : item.id,
                type  : item.type,
                state : newState,
                source: source
            });
        });
    });
};

Manager.prototype.processCmd = function (slimItem) {
    debug('processing cmd, slimItem = ' + JSON.stringify(slimItem));
    // validate input
    if (!slimItem || !slimItem.type || !slimItem.id) return;
    var typeNode = this.items[slimItem.type];
    if (typeNode === undefined) return;
    var fullItem = typeNode[slimItem.id];
    if (fullItem === undefined) return;

    // save data
    fullItem.setState(slimItem.state, 'socket');
};

Manager.prototype.dumpToClient = function () {
    var retObj = {};
    // create slim items for client initialization
    Object.keys(this.items).forEach((itemType) => {
        retObj[itemType] = {};
        Object.keys(this.items[itemType]).forEach((itemId) => {
            var item = this.items[itemType][itemId];
            retObj[itemType][itemId] = {
                id   : item.id,
                name : item.name,
                type : item.type,
                state: item.state
            };
        });
    });
    return retObj;
};

module.exports = Manager;