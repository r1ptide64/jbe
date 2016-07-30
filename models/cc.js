var cv2 = require('castv2-client');
var Client = cv2.Client;
var MediaController = cv2.MediaController;
var DefaultMediaReceiver = cv2.DefaultMediaReceiver;
var Application  = cv2.Application;
var mdns = require('mdns');
var Debug = require('debug');
var debug = Debug('jbe:cc');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
var Item = require('./item');

var sequence = [
    mdns.rst.DNSServiceResolve(),
    'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({
        families: [4]
    }),
    mdns.rst.makeAddressesUnique()
];
var browser = mdns.createBrowser(mdns.tcp('googlecast'), {
    resolverSequence: sequence
});

browser.on('serviceUp', function (service) {
    debug('found device %s at %s:%d', service.txtRecord.fn, service.addresses[0], service.port);
    if (service.txtRecord.fn.search('Milkshake') < 0) {
        return;
    }
    // retObj.add(new CastItem(service));
    // debug(JSON.stringify(retObj, replacer, '\t'));
    onDeviceUp(service);
    //debug(JSON.stringify(service, null, '\t'));
});
browser.start();

var RetObj = function () {
    var self = this;
    EventEmitter.call(self);
    this.count = 0;
    this.castItems = {};
    this.add = function (castItem) {
        if (this.castItems[castItem.name] == undefined) {
            this.count++;
            self.emit('add', castItem.name);
        }
        this.castItems[castItem.name] = castItem;
        if (this.count >= 4) {
            browser.stop();
        }
    };
    this.remove = function (castItem) {
        if (this.castItems[castItem.name] != undefined) {
            this.count--;
        }
        this.castItems[castItem.name] = undefined;
        if (this.count < 4) {
            browser.start();
        }
    };
};
util.inherits(RetObj, EventEmitter);
var retObj = new RetObj();

var Type2Prop = function(typeStr) {
    switch (typeStr) {
        case 'Chromecast Audio':
            return 'audio';
        case 'Google Cast Group':
            return 'group';
        case 'Chromecast':
            return 'video';
        default:
            return 'unknown';
    }
};
function replacer (key, value) {
    if (key == 'self') {
        return undefined;
    }
    return value;
}

var isMediaNamespace = function(namespace) {
    return namespace.name === 'urn:x-cast:com.google.cast.media';
}

var CastItem = function (service) {
    // var debug = Debug('jbe:cc:' + service.txtRecord.fn);
    debug('constructing CastItem!');
    EventEmitter.call(this);
    var self = this;
    Item.call(this, service.addresses[0] + service.port, service.txtRecord.fn, 'cc');
    this.castType = service.txtRecord.md;
    this.mediaReceiver = undefined;
    this.media = undefined;

    var options = {
        host: service.addresses[0],
        port: service.port
    };
    this.client = new Client();
    this.client.on('error', function (err) {
        debug('error :( ' + err);
    });

    this.processMediaStatus = function(err, status) {
        if (err || !status) {
            debug('error :( ', err);
            return;
        }
        debug('media status below.');
        debug(JSON.stringify(status, null, '\t'));
        if (status.media) {
            self.media = status.media;
        };
    };

    this.processReceiverStatus = function(err, status) {
        if (err) {
            debug('error :( ', err);
            return;
        }
        debug('status below');
        debug(JSON.stringify(status, null, '\t'));
        var currApp = (status.applications || [])[0];
        self.active = !(currApp == undefined || currApp.isIdleScreen);

        if (!self.active) {
            self.mediaReceiver = undefined;
            return;
        }
        if (currApp.namespaces.some(isMediaNamespace)) {
            if (self.mediaReceiver === undefined) {
                self.mediaReceiver = new DefaultMediaReceiver(self.client.client, currApp);
            }
            self.mediaReceiver.once('close', function () {
                self.mediaReceiver = undefined;
            })
            self.mediaReceiver.on('status', self.processMediaStatus.bind(this, null));
            self.mediaReceiver.getStatus(self.processMediaStatus);
        }
    };

    this.client.on('status', self.processReceiverStatus.bind(this, null));

    this.client.connect(options, function () {
        retObj.add(self);
        self.client.getStatus(self.processReceiverStatus);
    })
};

util.inherits(CastItem, EventEmitter);

module.exports = retObj;

// var genericCCEvent = function(err, data) {
//     debug('genericCCEvent called from ' + this);
//     if (err) {
//         debug('error! oh, no!');
//         console.error(err);
//         return;
//     }
//     debug('status below:');
//     debug(JSON.stringify(data));
// };


function onDeviceUp(hostService) {
    debug(JSON.stringify(hostService.txtRecord, null, '\t'));

    if (hostService.name.search('Milkshake') < 0) {
        return;
    }
    var client = new Client();
    var options = {
        host: hostService.addresses[0],
        port: hostService.port
    };
    // var makeGoogleMusic = function(session) {
    //     client.
    // };
    client.connect(options, function() {
        debug('client connected!');
        // var sessionId = undefined;
        // client.getStatus(genericCCEvent.bind('getStatus'));
        // client.getSessions(function (err, sessions) {
        //     if (err) {
        //         console.error(err);
        //         return;
        //     }
        //     debug('got sessions! ', JSON.stringify(sessions, null, '\t'));
        //     // var googleMusic = new DefaultMediaReceiver(client.client, sessions[0]);
        //     // googleMusic.on('status', genericCCEvent.bind('googleMusic'));
        //     // googleMusic.getStatus(genericCCEvent);
        // });


        client.launch(DefaultMediaReceiver, function(err, player) {
            if (err) {
                console.error(err);
                return;
            }
            debug('DefaultMediaReceiver launched!');
            player.on('status', function(status) {
                debug('player received status update!');
                debug(JSON.stringify(status, null, '\t'));
            });

            var media = {

                // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
                contentId: 'http://wpr-ice.streamguys.net/wpr-ideas-mp3-64',
                contentType: 'audio/mpeg',
                streamType: 'BUFFERED', // or LIVE

                // Title and cover displayed while buffering
                metadata: {
                    type: 0,
                    metadataType: 0,
                    title: "Big Buck Bunny",
                    images: [
                        { url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg' }
                    ]
                }
            };



            console.log('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId);

            player.load(media, { autoplay: true }, function(err, status) {
                console.log('media loaded playerState=%s', status.playerState);

                // // Seek to 2 minutes after 15 seconds playing.
                // setTimeout(function() {
                //     player.seek(2*60, function(err, status) {
                //         //
                //     });
                // }, 15000);

            });

        });

    });

    client.on('error', function(err) {
        console.log('Error: %s', err.message);
        client.close();
    });

};
// function oldondeviceup(hostService) {
//     debug('found device %s at %s:%d', hostService.name, hostService.addresses[0], hostService.port);
//     debug(JSON.stringify(hostService, null, '\t'));
//
//     var host = hostService.addresses[0];
//     var client = new Client();
//     client.connect(host, function () {
//         // create various namespace handlers
//         var connection = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.tp.connection', 'JSON');
//         var heartbeat = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.tp.heartbeat', 'JSON');
//         var receiver = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.receiver', 'JSON');
//         var media = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.media', 'JSON');
//         var sID;
//
//         // establish virtual connection to the receiver
//         connection.send({
//             type: 'CONNECT'
//         });
//
//         // start heartbeating
//         setInterval(function () {
//             heartbeat.send({
//                 type: 'PING'
//             });
//         }, 5000);
//
//         //        setInterval(function() {
//         //            media.send()
//         //        }, 5000);
//
//         //        // launch YouTube app
//         //        receiver.send({
//         //            type: 'LAUNCH',
//         //            appId: 'YouTube',
//         //            requestId: 1
//         //        });
//         setInterval(function () {
//             receiver.send({
//                 type: 'GET_STATUS',
//                 requestId: 1
//             });
//         }, 3000);
//         //display receiver status updates
//         receiver.on('message', function (data, broadcast) {
//             var debug = require('debug')('jbe:cc:stat');
//             debug(JSON.stringify(data, null, '\t'));
//             debug(JSON.stringify(broadcast, null, '\t'));
//         });
//     });
//
// }