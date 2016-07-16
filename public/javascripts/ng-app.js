var joebApp = angular.module('joebApp', ['ngMaterial', 'ngResource']);

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
    $scope.socket = socket;
    socket.on('init', function (cliData) {
        console.log(cliData);
        $scope.cliData = cliData;
        var timeoutInstance;
        $scope.$watch('cliData.hvac.setpoint.state', function (newVal, oldVal) {
            if (isNaN(newVal) || isNaN(oldVal)) {
                return;
            }
            else if (newVal !== oldVal) {
                if (timeoutInstance) {
                    $timeout.cancel(timeoutInstance);
                }
                timeoutInstance = $timeout(function () {
                    $scope.sendCommand($scope.cliData.hvac.setpoint);
                }, 2000);
            }
        });
    });
    socket.on('change', function (slimItem) {
        console.log('change, slimItem = ' + JSON.stringify(slimItem));
        var myItem = cli2item(slimItem);
        if (myItem === undefined) {
            console.log('error');
            return;
        }
        myItem.state = slimItem.state;
    });
    $scope.toggleSwitch = function (theSwitch) {
        theSwitch.state = !theSwitch.state;
        $scope.sendCommand(theSwitch);
    }
    $scope.sendCommand = function (oneItem) {
        socket.emit('command', oneItem);
        console.log('emitted command!');
    };
    $scope.hvacModes = ["Off", "Heat", "AC"];
    $scope.isExpanded = false;
    $scope.toggleExpansion = function () {
        $scope.isExpanded = !$scope.isExpanded;
    }
}]);