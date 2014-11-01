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
					key: value.index
				});	
			}, $scope.navItems);
		}).
		error(function(data, status, headers, config) {
		  // log error
		});

	$scope.setKey = messageService.setKey;
	

	$scope.oneAtATime = true; 
}]);



myApp.controller('ViewCtrl', ['$scope', '$http', 'messageService',
	function($scope, $http, messageService){
		$scope.messages = messageService.messages;
		$scope.key = messageService.key;
	}
]);

myApp.service('messageService', function($http){
	var key = 'No Key';
	var messages = [];
	
	var setKey = function(newKey){
		console.log('Setting key as', newKey);
		key = newKey;
		fetchMessages();
	};

	var getKey = function(){
		return key;
	};

	var fetchMessages = function(){
		console.log('Getting messages');
		$http.get('http://localhost:4001/api/v1/key/' + key).
		success(function(data, status, headers, config) {	
			angular.forEach(data, function(value, key) {
			  	this.push(value);	
			}, messages);
		}).
		error(function(data, status, headers, config) {
		  console.log('Could not fetch messages');
		});	
	};

	return {
		fetchMessages: fetchMessages,
		setKey: setKey,
		getKey: getKey,
		messages: messages,
		key: key
	};
});



