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
					key: value,
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



myApp.controller('TableCtrl', ['$scope', 'messageService',
	function($scope, messageService){
		$scope.maxSize = 10;
		$scope.data = messageService.data;
		$scope.pageChanged = messageService.pageChanged;
	}
]);

myApp.controller('FilterCtrl', ['$scope', 'messageService',
	function($scope, messageService){
		$scope.data = messageService.data;
		$scope.filter = messageService.filter;

	}
]);

myApp.service('messageService', function($http){
	var data = {
		key: 'No Key', 
		messages: [],
		totalMessages: 0,
		messagesTake: 100,
		messagesFrom: 0,
		currentPage: 1,
		dateFrom: '',
		dateTo: ''};

	var setKey = function(newKey){
		console.log('Setting key as', newKey);
		data.key = newKey;
		data.currentPage = 1;
		fetchMessages();
	};

	var getKey = function(){
		return data.key;
	};

	var filter = function(){
		console.log('Getting messages');
		$http.post('http://localhost:4001/api/v1/keys/timerange',
			{
				from: data.dateFrom,
				to: data.dateTo,
				key: data.key
			}).
		success(function(apiData, status, headers, config) {
			
			if(status = 200){	
				data.messages = apiData;
				data.messagesSubSet = data.messages.slice(0, 100);
				data.totalMessages = data.messages.length;
				console.log(apiData);
				console.log('Got messages');				
			}else {
				console.log(data);
			}
		}).
		error(function(data, status, headers, config) {
		  console.log('Could not fetch messages');
		});	
	};

	var fetchMessages = function(){
		console.log('Getting messages');

		$http.get('http://localhost:4001/api/v1/key/' + data.key + '/count').
		success(function(apiData, status, headers, config) {	
			data.totalMessages = apiData;
			console.log('Got count');
		}).
		error(function(data, status, headers, config) {
		  console.log('Could not fetch messages');
		});	
		
		$http.get('http://localhost:4001/api/v1/key/' + data.key + '/from/' + data.messagesFrom + '/take/' + data.messagesTake).
		success(function(apiData, status, headers, config) {	
			data.messages = apiData;
			console.log('Got messages');
		}).
		error(function(data, status, headers, config) {
		  console.log('Could not fetch messages');
		});	
	};

	var pageChanged = function(){
		data.messagesFrom = (data.currentPage - 1) * data.messagesTake;
		fetchMessages();
	}

	return {
		fetchMessages: fetchMessages,
		setKey: setKey,
		getKey: getKey,
		pageChanged: pageChanged,
		filter: filter,
		data: data
	};
});



