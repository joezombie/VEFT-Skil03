'use strict';

// Declare app level module which depends on views, and components
var myApp = angular.module('myApp', [
  'ngRoute',
  'ui.bootstrap'
]);

myApp.controller('MenuCtrl', ['$scope', '$http', 'messageService',  function($scope, $http, messageService) {
	$scope.navItems = [];

	$scope.groups = [];

	$http.get('http://localhost:4001/api/v1/keys').
		success(function(data, status, headers, config) {	
			angular.forEach(data, function(value, key) {
			  this.push({
					key: value.index,
					classes: ''
				});	
			}, $scope.navItems);
			if($scope.navItems.length > 0){
				$scope.setKey($scope.navItems[0].key);
			}
		}).
		error(function(data, status, headers, config) {
		  // log error
		});

	$scope.setKey = function(key){
		angular.forEach($scope.navItems, function(value, index) {
			if(value.key === key){
				value.classes = 'active';
			}else {
				value.classes = '';
			}
		}, $scope.navItems);
		messageService.setKey(key);
	}
	

	$scope.oneAtATime = true; 
}]);



myApp.controller('ViewCtrl', ['$scope', '$http', 'messageService',
	function($scope, $http, messageService){
		$scope.messages = messageService.data.messages;
		$scope.key = messageService.data.key;
		$scope.data = messageService.data;
	}
]);

myApp.service('messageService', function($http){
	var data = {key: 'No Key', messages: []};
	
	var setKey = function(newKey){
		console.log('Setting key as', newKey);
		data.key = newKey;
		fetchMessages();
	};

	var getKey = function(){
		return data.key;
	};

	var fetchMessages = function(){
		console.log('Getting messages');
		$http.get('http://localhost:4001/api/v1/key/' + data.key).
		success(function(apiData, status, headers, config) {	
			data.messages = apiData;
			console.log('Got messages');
		}).
		error(function(data, status, headers, config) {
		  console.log('Could not fetch messages');
		});	
	};

	return {
		fetchMessages: fetchMessages,
		setKey: setKey,
		getKey: getKey,
		data: data
	};
});



