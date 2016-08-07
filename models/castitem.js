var Item                 = require('./item'),
    util                 = require('util'),
    cv2                  = require('castv2-client'),
    Client               = cv2.Client,
    DefaultMediaReceiver = cv2.DefaultMediaReceiver,
    debug                = require('debug')('jbe:castitem');

function CastItem(service) {
    // validate parameter
    if (!service || !Array.isArray(service.addresses) || !service.port || !service.txtRecord) {
        throw new Error('poop');
    }

    Item.call(this, service.addresses[0] + ':' + service.port, service.txtRecord.fn, 'cc');
    this.castType = service.txtRecord.md;
    this.client = new Client();
    this.client.once('error', (err) => {
        this.emit('error', err);
    });
    this.processMediaStatus = function (err, status) {
        var now = Date.now();
        if (err || !status) {
            debug('error :( ', err);
            return;
        }
        var updates = {};
        debug('media status below.');
        debug(JSON.stringify(status, null, '\t'));
        if (status.media) {
            this.media = status.media;
            updates.media = status.media;
        }
        status.timestamp = now;
        this.mediaStatus = status;
        updates.mediaStatus = status;
        this.emit('castUpdate', updates);
    };
    this.processReceiverStatus = function (err, status) {
        if (err) {
            debug('error :( ', err);
            return;
        }
        debug('status below');
        debug(JSON.stringify(status, null, '\t'));
        // this.setState(status, 'cc');
        var currApp = (status.applications || [])[0];
        this.active = !(currApp === undefined || currApp.isIdleScreen);

        if (!this.active || !currApp.namespaces) {
            delete this.mediaReceiver;
        }
        else if (currApp.namespaces.some(isMediaNamespace)) {
            if (this.mediaReceiver === undefined) {
                this.mediaReceiver = new DefaultMediaReceiver(this.client.client, currApp);
                this.mediaReceiver.once('close', () => {
                    delete this.mediaReceiver;
                })
                this.mediaReceiver.on('status', this.processMediaStatus.bind(this, null));
                this.mediaReceiver.getStatus(this.processMediaStatus.bind(this));
            }
        }
        this.receiverStatus = status;
        this.emit('castUpdate', {
            active: this.active,
            receiverStatus: this.receiverStatus
        });
    };

    this.client.on('status', this.processReceiverStatus.bind(this, null));

    var options = {
        host: service.addresses[0],
        port: service.port
    };
    this.client.connect(options, () => {
        this.client.getStatus(this.processReceiverStatus.bind(this));
    })
}
util.inherits(CastItem, Item);

CastItem.prototype.toJSON = function () {
    var ret = Item.prototype.toJSON.call(this);
    ret.castType = this.castType;
    ret.media = this.media;
    ret.receiverStatus = this.receiverStatus;
    ret.mediaStatus = this.mediaStatus;
    ret.active = this.active;
    return ret;
};

CastItem.prototype.exec = function (command, params) {
    if (!command) return;

    var fn = this[command];
    if (typeof fn !== 'function') return;

    fn.call(this, params);
};

CastItem.prototype.playCustomMedia = function (media) {
    this.client.launch(DefaultMediaReceiver, (err, player) => {
        player.load(media, { autoplay: true }, (err, status) => {
            if (err) {
                debug('error :(' + err);
            }
            else {
                debug('playing media!');
                debug(status);
            }
        });
    });
};

CastItem.prototype.setVolume = function (volume) {
    this.client.setVolume(volume, (err, newVolume) => {
        debug('set volume, err = ' + err + ', newVolume = ' + newVolume);
    });
};

CastItem.prototype.stopCasting = function () {
    if (!this.receiverStatus || !this.receiverStatus.applications) {
        return;
    }
    this.client.receiver.stop(this.receiverStatus.applications[0].sessionId, (err, status) => {
        if (err) {
            debug('error :( ' + err);
        }
        else {
            debug('stop successful. ' + status);
        }
    });
};

function isMediaNamespace(namespace) {
    return namespace.name === 'urn:x-cast:com.google.cast.media';
}

module.exports = CastItem;
