var joebApp = angular.module('joebApp', ['ngMaterial', 'ngResource']);

joebApp.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('blue-grey')
        .accentPalette('light-green');
});

joebApp.factory('socket', [ '$rootScope', function ($rootScope) {
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
    var timeoutInstance;
    $scope.$watch('hvacState.setpoint', function (newVal, oldVal) {
        if (isNaN(newVal) || isNaN(newVal)) {
            return;
        }
        else if (newVal !== oldVal) {
            if (timeoutInstance) {
                $timeout.cancel(timeoutInstance);
            }
            timeoutInstance = $timeout(function () {
                $scope.hvacState.$save();
            }, 150);
        }
    });
}]);

joebApp.controller("joebController", ['$scope', 'socket', function ($scope, socket) {
    $scope.jbtest = "bacon";
    $scope.socket = socket;
    socket.on('init', function (cliData) {
        console.log(cliData);
        $scope.switches = cliData.switches;
        $scope.hvac = cliData.hvac;
        $scope.jbtest = "received update after init event!";
    });
    $scope.sendCommand = function (oneItem) {
        socket.emit('command', oneItem);
    };
    $scope.hvacModes = ["Off", "Heat", "AC"];
}]);