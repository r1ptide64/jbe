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

joebApp.factory('Items', ['$resource', function ($resource) {
    return $resource('/items/:id', { id: '@id' });
}]);


joebApp.factory('HvacState', ['$resource', function ($resource) {
    return $resource('/hvac/:id', { id: '@id' });
}]);

joebApp.controller('SwitchControl', ['$scope', 'Items', 'socket', function ($scope, Items, socket) {
    //$scope.switches = Items.query();

}]);

joebApp.controller('HvacControl', ['$scope', '$timeout', 'HvacState', 'socket', function ($scope, $timeout, HvacState, socket) {
    $scope.hvacState = HvacState.query();
    $scope.hvacModes = ["Off", "Heat", "AC"];
}]);

joebApp.controller("joebController", ['$scope', '$timeout', 'socket', function ($scope, $timeout, socket) {
    var cli2item = function (slimItem) {
        console.log('cli2item, slimitem = ' + JSON.stringify(slimItem));
        function findItem(oneItem) {
            return oneItem.id == slimItem.id;
        };
        for (var itmIndx in $scope.hvac) {
            console.log('itmIndx = ' + itmIndx);
            var ret = $scope.hvac[itmIndx];
            if (findItem(ret)) return ret;
        };
        for (var itmIndx in $scope.switches) {
            console.log('itmIndx = ' + itmIndx);
            var ret = $scope.switches[itmIndx];
            if (findItem(ret)) return ret;
        };
        return undefined;
        //var ret = $scope.switches.find(findItem);
        //if (ret != undefined) return ret;
        //for (var prop in $scope.hvac) {
        //    ret = $scope.hvac[prop];
        //    if (findItem(ret)) return ret;
        //}
        //return undefined;
    };
    $scope.jbtest = "bacon";
    $scope.socket = socket;
    socket.on('init', function (cliData) {
        console.log(cliData);
        $scope.switches = cliData.switches;
        $scope.hvac = cliData.hvac;
        $scope.jbtest = "received update after init event!";
        var timeoutInstance;
        $scope.$watch('hvac.setpoint.state', function (newVal, oldVal) {
            if (isNaN(newVal) || isNaN(newVal)) {
                return;
            }
            else if (newVal !== oldVal) {
                if (timeoutInstance) {
                    $timeout.cancel(timeoutInstance);
                }
                timeoutInstance = $timeout(function () {
                    $scope.sendCommand($scope.hvac.setpoint);
                }, 400);
            }
        });
    });
    socket.on('change', function (slimItem) {
        console.log('change, slimItem = ' + JSON.stringify(slimItem));
        var myItem = cli2item(slimItem);
        if (myItem === undefined) {
            console.log('error');
        }
        myItem.state = slimItem.state;
    });
    $scope.sendCommand = function (oneItem) {
        socket.emit('command', oneItem);
        console.log('emitted command!');
    };
    $scope.hvacModes = ["Off", "Heat", "AC"];

}]);