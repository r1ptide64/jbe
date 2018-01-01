var ret = {};

try {
    var mdns         = require('mdns');
    var EventEmitter = require('events').EventEmitter;
    var debug        = require('debug')('jbe:browser');


    var sequence = [
        mdns.rst.DNSServiceResolve(),
        'DNSServiceGetAddrInfo' in mdns.dns_sd
            ? mdns.rst.DNSServiceGetAddrInfo()
            : mdns.rst.getaddrinfo({
                families: [4]
            }),
        mdns.rst.makeAddressesUnique()
    ];

    ret.setupBrowser   = setupBrowser;
    ret.onBrowserError = onBrowserError;
}
catch (err) {
    ret.setupBrowser   = dummy;
    ret.onBrowserError = dummy;
}

function dummy() {
}

function setupBrowser() {
    try {
        this.browser = mdns.createBrowser(mdns.tcp('googlecast'), {
            resolverSequence: sequence
        });
        this.browser.on('serviceUp', (service) => {
            this.addCastItem(service);
        });
        this.browser.once('error', onBrowserError.bind(this));
        this.browser.start();
    } catch (err) {
        setTimeout(onBrowserError.bind(this, err), 5000);
    }
}

function onBrowserError(err) {
    debug('mdns browser encountered an error: ' + err);
    if (this.browser instanceof EventEmitter) {
        this.browser.removeAllListeners();
    }
    this.browser = null;
    setupBrowser.call(this);
}

module.exports = ret;