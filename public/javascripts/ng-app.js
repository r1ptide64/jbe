var joebApp = angular.module('joebApp', ['ngMaterial']);

joebApp.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('blue-grey')
        .accentPalette('light-green');
});

joebApp.factory('socket', ['$rootScope', function ($rootScope) {
    var socket = io();
    return {
        on: function (eventName, callback) {
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

joebApp.controller("joebController", ['$scope', '$timeout', 'socket', function ($scope, $timeout, socket) {
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
    $scope.setpointAry = makePotentialSetpoints(55, 0.5, 85);
    $scope.socket = socket;
    socket.on('init', function (items) {
        console.log(items);
        $scope.items = items;
        // var timeoutInstance;
        // $scope.$watch('items.hvac.setpoint.state', function (newVal, oldVal) {
        //     if (isNaN(newVal) || isNaN(oldVal)) {
        //         return;
        //     }
        //     else if (newVal !== oldVal) {
        //         if (timeoutInstance) {
        //             $timeout.cancel(timeoutInstance);
        //         }
        //         timeoutInstance = $timeout(function () {
        //             $scope.sendCommand($scope.items.hvac.setpoint);
        //         }, 2000);
        //     }
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
    socket.on('cc', function (cc) {
        console.log(JSON.stringify(cc, null, '\t'));
    });
    $scope.toggleSwitch = function (theSwitch) {
        theSwitch.state = !theSwitch.state;
        $scope.sendCommand(theSwitch);
    }
    $scope.sendCommand = function (oneItem) {
        socket.emit('command', oneItem);
        console.log('emitted command! oneItem = ' + JSON.stringify(oneItem));
    };
    $scope.hvacModes = ["Off", "Heat", "AC"];
    $scope.isExpanded = false;
    $scope.toggleExpansion = function () {
        $scope.isExpanded = !$scope.isExpanded;
    }
}]);