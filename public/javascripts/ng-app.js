var joebApp = angular.module('joebApp', ['ngMaterial', 'ngResource']);

joebApp.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('blue-grey')
        .accentPalette('light-green');
});

joebApp.factory('Items', ['$resource', function ($resource) {
        return $resource('/items/:id', { id: '@id' });
    }]);


joebApp.factory('HvacState', ['$resource', function ($resource) {
        return $resource('/hvac/:id', { id: '@id' });    
    }]);

joebApp.controller('SwitchControl', ['$scope', 'Items', function ($scope, Items) {
        $scope.switches = Items.query();
}]);

joebApp.controller('HvacControl', ['$scope', '$timeout', 'HvacState', function ($scope, $timeout, HvacState) {
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
joebApp.controller("joebController", function ($scope) {
    $scope.hvacMode = '';
    $scope.hvacModes = ["Off", "Heat", "AC"];
    $scope.temp = '75 degrees';
    $scope.humid = '35 %';
});