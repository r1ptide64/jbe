var Item         = require('./item.js'),
    util         = require('util'),
    EventEmitter = require('events').EventEmitter,
    debug        = require('debug')('jbe:manager'),
    mdns         = require('mdns'),
    CastItem     = require('./castitem');

var sequence = [
    mdns.rst.DNSServiceResolve(),
    'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({
        families: [4]
    }),
    mdns.rst.makeAddressesUnique()
];

function setupBrowser() {
    this.browser = mdns.createBrowser(mdns.tcp('googlecast'), {
        resolverSequence: sequence
    });
    this.browser.on('serviceUp', (service) => {
        this.addCastItem(service);
    });
    this.browser.once('error', this.onBrowserError.bind(this));
    this.browser.start();
}

function Manager() {
    this.items = {};
    this.items.cc = {};
    EventEmitter.call(this);
    setupBrowser.call(this);
}
util.inherits(Manager, EventEmitter);

Manager.prototype.onBrowserError = function (err) {
    debug('mdns browser encountered an error: ' + err);
    delete this.browser;
    setupBrowser.call(this);
};

Manager.prototype.addCastItem = function (service) {
    debug('found device %s at %s:%d', service.txtRecord.fn, service.addresses[0], service.port);
    var newCastItem = new CastItem(service);

    this.insert(newCastItem);
    newCastItem.once('error', (err) => {
        debug(newCastItem.name + ' encountered an error! ' + err);
        delete this.items.cc[newCastItem.id];
        try {
            this.browser.start();
        } catch (err) {
            this.onBrowserError(err);
        }
    });
    newCastItem.on('castUpdate', (updates) => {
        this.emit('castUpdate', newCastItem.id, updates);
    });
    if (Object.keys(this.items.cc).length >= 4) {
        debug('all chromecasts discovered, stopping browser.');
        this.browser.stop();
    }
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