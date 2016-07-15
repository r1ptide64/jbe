var Client = require('castv2-client').Client;
var MediaController = require('castv2-client').MediaController;
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
var mdns = require('mdns');
var debug = require('debug')('jbe:cc');

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
    debug('found device %s at %s:%d', service.name, service.addresses[0], service.port);
    onDeviceUp(service);
    //debug(JSON.stringify(service, null, '\t'));
});
browser.start();

var retObj = {
    audio: [],
    video: []
};


var CastItem = function (id, name, client) {
    this.id = id;
    this.name = name;
    this.client = client;
}

retObj.AddCastItem = function (client, hostService) {
    var type = (hostService.txtRecord.md === 'Chromecast')
        ? 'video'
        : 'audio';

}

function onDeviceUp(hostService) {

    var client = new Client();
    var host = hostService.addresses[0];
    client.connect(host, function() {
        // debug('client connected!');
        // client.launch(MediaController, function (err, mediaController) {
        //     debug('media controller launched!');
        // });
        // var castItem = new CastItem(hostService.name, )
        // console.log('connected, launching app ...');

        // client.launch(DefaultMediaReceiver, function(err, player) {
        //     var media = {
        //
        //         // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
        //         contentId: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
        //         contentType: 'video/mp4',
        //         streamType: 'BUFFERED', // or LIVE
        //
        //         // Title and cover displayed while buffering
        //         metadata: {
        //             type: 0,
        //             metadataType: 0,
        //             title: "Big Buck Bunny",
        //             images: [
        //                 { url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg' }
        //             ]
        //         }
        //     };
        //
        //     player.on('status', function(status) {
        //         console.log('status broadcast playerState=%s', status.playerState);
        //     });
        //
        //     console.log('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId);
        //
        //     player.load(media, { autoplay: true }, function(err, status) {
        //         console.log('media loaded playerState=%s', status.playerState);
        //
        //         // Seek to 2 minutes after 15 seconds playing.
        //         setTimeout(function() {
        //             player.seek(2*60, function(err, status) {
        //                 //
        //             });
        //         }, 15000);
        //
        //     });
        //
        // });

    });

    client.on('error', function(err) {
        console.log('Error: %s', err.message);
        client.close();
    });

}
function oldondeviceup(hostService) {
    debug('found device %s at %s:%d', hostService.name, hostService.addresses[0], hostService.port);
    debug(JSON.stringify(hostService, null, '\t'));

    var host = hostService.addresses[0];
    var client = new Client();
    client.connect(host, function () {
        // create various namespace handlers
        var connection = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.tp.connection', 'JSON');
        var heartbeat = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.tp.heartbeat', 'JSON');
        var receiver = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.receiver', 'JSON');
        var media = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.media', 'JSON');
        var sID;

        // establish virtual connection to the receiver
        connection.send({
            type: 'CONNECT'
        });

        // start heartbeating
        setInterval(function () {
            heartbeat.send({
                type: 'PING'
            });
        }, 5000);

        //        setInterval(function() {
        //            media.send()
        //        }, 5000);

        //        // launch YouTube app
        //        receiver.send({
        //            type: 'LAUNCH',
        //            appId: 'YouTube',
        //            requestId: 1
        //        });
        setInterval(function () {
            receiver.send({
                type: 'GET_STATUS',
                requestId: 1
            });
        }, 3000);
        //display receiver status updates
        receiver.on('message', function (data, broadcast) {
            var debug = require('debug')('jbe:cc:stat');
            debug(JSON.stringify(data, null, '\t'));
            debug(JSON.stringify(broadcast, null, '\t'));
        });
    });

}