var joebApp = angular.module('joebApp', ['ngMaterial']);

joebApp.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('blue-grey')
        .accentPalette('light-green');
});

joebApp.factory('socket', ['$rootScope', function ($rootScope) {
    var socket = io();
    return {
        on  : function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
}]);

joebApp.controller("joebController", ['$scope', '$timeout', '$interval', 'socket', function ($scope, $timeout, $interval, socket) {
    var cli2item = function (slimItem) {
        console.log('cli2item, slimitem = ' + JSON.stringify(slimItem));
        function findItem(oneItem) {
            return oneItem.id == slimItem.id;
        };
        for (var itmClass in $scope.cliData) {
            for (var itmIndx in $scope.cliData[itmClass]) {
                var ret = $scope.cliData[itmClass][itmIndx];
                if (findItem(ret)) return ret;
            }
        }
        return undefined;
    };
    var makePotentialSetpoints = function (start, step, end) {
        var ret = [];
        for (var counter = start; counter <= end; counter += step) {
            ret.push(counter);
        }
        return ret;
    };

    function zorba() {
        var now = new Date();
        var dofw = now.getDay();
        if (dofw !== 6) {
            now.setDate(now.getDate() - (dofw + 1));
        }
        var year = now.getYear() % 100;
        if (year < 10) {
            year = '0' + year;
        }
        var month = now.getMonth();
        if (month < 10) {
            month = '0' + month;
        }
        var date = now.getDate();
        if (date < 10) {
            date = '0' + date;
        }
        return 'http://podcast.wpr.org/zph/zph' + year + month + date + '.mp3';
    };
    $scope.customCastMedia = [
        {
            contentId  : 'http://wpr-ice.streamguys.net/wpr-ideas-mp3-64',
            contentType: 'audio/mpeg',
            streamType : 'BUFFERED',
            metadata   : {
                type        : 0,
                metadataType: 0,
                title       : "WPR Ideas Network Live Stream",
            }
        },
        {
            contentId  : zorba(),
            contentType: 'audio/mpeg',
            streamType : 'BUFFERED',
            metadata   : {
                type        : 0,
                metadataType: 0,
                title       : "Zorba Paster On Your Health",
            }
        }
    ];
    $scope.setpointAry = makePotentialSetpoints(55, 0.5, 85);
    $scope.socket = socket;
    socket.on('init', function (items) {
        console.log(items);
        $scope.items = items;
        Object.keys($scope.items.cc).forEach((id) => {
            var oneCastItem = $scope.items.cc[id];
            console.log('setting up watch on ' + oneCastItem.name + '!');
            var timeoutInstance;
            $scope.$watch("items.cc['" + id + "'].receiverStatus.volume.level", (newVal, oldVal) => {

                console.log('volume changed on ' + id + '!');
                if (isNaN(newVal) || isNaN(oldVal)) {
                    return;
                }
                else if (newVal !== oldVal) {
                    if (timeoutInstance) {
                        $timeout.cancel(timeoutInstance);
                    }
                    timeoutInstance = $timeout(() => {
                        $scope.castCmd(oneCastItem, 'setVolume', { level: newVal });
                    }, 150);
                }
            });
        });

        // var timeoutInstance;
        // $scope.$watch('items.hvac.setpoint.state', function (newVal, oldVal) {
        //
        // });
    });
    socket.on('change', function (slimItem) {
        console.log('change, slimItem = ' + JSON.stringify(slimItem));
        // validate input
        if (!slimItem || !slimItem.type || !slimItem.id) return;
        var typeNode = $scope.items[slimItem.type];
        if (typeNode === undefined) return;
        var fullItem = typeNode[slimItem.id];
        if (fullItem === undefined) return;

        // save data
        fullItem.state = slimItem.state;
    });
    socket.on('castUpdate', (id, updates) => {
        console.log('castUpdate on ' + id + ', updates = ' + JSON.stringify(updates, null, '\t'));
        var fullItem = $scope.items.cc[id];
        if (fullItem === undefined) {
            console.log('no castItem with that ID!');
            return;
        }
        Object.keys(updates).forEach((prop) => {
            fullItem[prop] = updates[prop];
        });
        console.log('fullItem = ' + JSON.stringify(fullItem, null, '\t'));
    });
    $scope.castIcon = function (castItem) {
        switch (castItem.castType) {
            case 'Chromecast Audio':
                return 'speaker';
            case 'Google Cast Group':
                return 'speaker_group';
            case 'Chromecast':
                return 'video_library';
            default:
                return 'error_outline';
        }
    };
    function checkPlayerInterval(castItem) {
        if (castItem.mediaStatus) {
            if (castItem.playerInterval) {
                $interval.cancel(castItem.playerInterval);
            }
            if (castItem.mediaStatus.playerState === 'PLAYING') {
                castItem.playerInterval = $interval(() => {
                    castItem.mediaStatus.currentTime += 1;
                }, 1000);
            }
            ;
        }
    };
    function durationFormatter(sec_num) {
        sec_num = parseInt(sec_num, 10);
        if (isNaN(sec_num)) sec_num = 0;
        var hours = Math.trunc(sec_num / 3600);
        var minutes = Math.trunc((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours < 10) {
            hours = "0" + hours;
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        return hours + ':' + minutes + ':' + seconds;
    };
    $scope.castDuration = function (castItem) {
        if (!castItem || !castItem.media) {
            return '';
        }
        return durationFormatter(castItem.media.duration);
    };
    $scope.castCurrentTime = function (castItem) {
        if (!castItem || !castItem.mediaStatus) {
            return '';
        }
        var currentTime = castItem.mediaStatus.currentTime;
        if (castItem.mediaStatus.playerState === 'PLAYING') {
            currentTime += (new Date().getTime() - castItem.mediaStatus.timestamp) / 1000;
        }
        return durationFormatter(currentTime);
    };
    $scope.toggleMute = function (castItem) {
        var muted = !castItem.receiverStatus.volume.muted;
        castItem.receiverStatus.volume.muted = muted;
        $scope.castCmd(castItem, 'setVolume', { muted: muted });
    };
    $scope.castPlayPause = function (castItem) {

    };
    $scope.playCustomMedia = function (castItem, media) {
        $scope.castCmd(castItem, 'playCustomMedia', media);
    };
    $scope.stopCasting = function (castItem) {
        $scope.castCmd(castItem, "stopCasting");
    }
    $scope.castCmd = function (castItem, command, params) {
        socket.emit('castCmd', {
            command: command,
            id     : castItem.id,
            params : params
        });
    };
    $scope.toggleSwitch = function (theSwitch) {
        theSwitch.state = !theSwitch.state;
        $scope.sendCommand(theSwitch);
    };
    $scope.sendCommand = function (oneItem) {
        socket.emit('command', oneItem);
        console.log('emitted command! oneItem = ' + JSON.stringify(oneItem));
    };
    $scope.pulseHvac = function (newState) {
        $scope.items.hvac.blowing.state = newState;
        $scope.sendCommand($scope.items.hvac.blowing);
    };
    $scope.hvacModes = ["Off", "Heat", "AC"];
    $scope.toggleExpansion = function (castItem) {
        castItem.expanded = !castItem.expanded;
    }
}]);