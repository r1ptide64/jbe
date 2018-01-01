var Item         = require('./item.js'),
    util         = require('util'),
    EventEmitter = require('events').EventEmitter,
    debug        = require('debug')('jbe:manager'),
    browser      = require('./browser.js'),
    CastItem     = require('./castitem');


function Manager() {
    debug('creating Manager()');
    this.items    = {};
    this.items.cc = {};
    EventEmitter.call(this);
    browser.setupBrowser.call(this);
}

util.inherits(Manager, EventEmitter);


Manager.prototype.addCastItem = function (service) {
    // validate input
    if (!service || !Array.isArray(service.addresses) || !service.port || !service.txtRecord) {
        debug('attempt to create CastItem from bad service.');
        return;
    }

    // check for duplicates
    if (this.items.cc[service.txtRecord.fn]) {
        debug('duplicate CastItem found.');
        return;
    }

    var newCastItem = new CastItem(service);

    this.insert(newCastItem);
    debug('inserting CastItem %s', newCastItem.name);
    newCastItem.once('error', (err) => {
        debug(newCastItem.name + ' encountered an error! ' + err);
        newCastItem.removeAllListeners();
        delete this.items.cc[newCastItem.id];
        try {
            this.browser.start();
        } catch (err) {
            browser.onBrowserError.call(this, err);
        }
    });
    newCastItem.on('castUpdate', (updates) => {
        this.emit('castUpdate', newCastItem.id, updates);
    });
    // if (Object.keys(this.items.cc).length >= 4) {
    //     debug('all chromecasts discovered, stopping browser.');
    //     try {
    //         browser.stop();
    //     }
    //     catch (err) {
    //         onBrowserError.call(this, err);
    //     }
    // }
};

Manager.prototype.castCmd = function (cmdData) {
    if (!cmdData || !cmdData.id) return;
    var castItem = this.items.cc[cmdData.id];
    if (!castItem) return;
    castItem.exec(cmdData.command, cmdData.params);
};

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
        item.on('error', (err) => {
            debug(`${item.name} encountered an error! ${err}`);
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
            var item                 = this.items[itemType][itemId];
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