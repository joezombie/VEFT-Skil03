'use strict';

// Declare app level module which depends on views, and components
var myApp = angular.module('myApp', [
  'ngRoute',
  'ui.bootstrap'
]);


function MenuCtrl($scope, $http){
	//$http.get();
	$scope.oneAtATime = true;

  $scope.groups = [
    {
      title: 'test.py-test',
      content: '<button class="btn btn-default btn-sm" ng-click="addItem()">Add Item</button>'
    },
    {
      title: 'test.py-test2',
      content: 'Dynamic Group Body - 2'
    }
  ];
}

function ViewCtrl($scope){
	$scope.key = 'View';
}



