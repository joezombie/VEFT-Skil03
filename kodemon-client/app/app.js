'use strict';

// Declare app level module which depends on views, and components
var myApp = angular.module('myApp', [
  'ngRoute',
  'ui.bootstrap',
  'highcharts-ng'
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

myApp.controller('GraphCtrl', ['$scope', 'graphService',
	function($scope, graphService){
		$scope.chartConfig = graphService.chartConfig;
	}
]);

myApp.controller('FilterCtrl', ['$scope', 'messageService',
	function($scope, messageService){
		$scope.data = messageService.data;
		$scope.filter = messageService.filter;

	}
]);

myApp.service('graphService', function($http){
	var key = '';
	var intervalRef;
	var chartConfig = {
	         //This is not a highcharts object. It just looks a little like one!
	         options: {
	             //This is the Main Highcharts chart config. Any Highchart options are valid here.
	             //will be ovverriden by values specified below.
	             chart: {
	                 type: 'column',
	                 animation : false
	             },
	             tooltip: {
	                 style: {
	                     padding: 10,
	                     fontWeight: 'bold'
	                 }
	             }
	         },

	         //The below properties are watched separately for changes.

	         //Series object (optional) - a list of series using normal highcharts series options.
	         series: [{
	             data: []
	         }],
	         //Title configuration (optional)
	         title: {
	             text: 'Title'
	         },
	         //Boolean to control showng loading status on chart (optional)
	         loading: false,
	         //Configuration for the xAxis (optional). Currently only one x axis can be dynamically controlled.
	         //properties currentMin and currentMax provied 2-way binding to the chart's maximimum and minimum
	         xAxis: {
              	type: 'datetime',
          		title: {text: 'Timestamp'},
          		floor : 0
	         },
	         yAxis: {
	          title: {text: 'Execution time (ms)'}
	         },
	         //Whether to use HighStocks instead of HighCharts (optional). Defaults to false.
	         useHighStocks: false,
	         //size (optional) if left out the chart will default to size of the div or something sensible.
	         //function (optional)
	         func: function (chart) {
	           //setup some logic for the chart
	         }
	    };

    var updateChart = function(){
    	var lastMessage = chartConfig.series[0].data[chartConfig.series[0].data.length - 1];

		$http.post('http://localhost:4001/api/v1/keys/timerange',
			{
				from: lastMessage[0],
				to: new Date(),
				key: key
			}).
		success(function(apiData, status, headers, config) {			
			if(status = 200){	
				for(var i =  apiData.length -1; i >=0 ; i--){	
					console.log(new Date(apiData[i].timestamp).getTime());			
					addPoint([
						new Date(apiData[i].timestamp).getTime(),
						apiData[i].execution_time]);
				};
				//chartConfig.series[0].data = newSeries;
				
			}else {
				console.log(data);
			}
		}).
		error(function(data, status, headers, config) {
		  console.log('Could not fetch messages');
		});	

    }

    var addPoint = function (point){
    	chartConfig.series[0].data.splice(0, 1);
    	chartConfig.series[0].data.push(point);
    }
    
    var setKey = function(newKey){
    	key = newKey;
    	chartConfig.title.text=newKey;
    }

    var startLiveUpdate = function(){
    	$http.get('http://localhost:4001/api/v1/key/' + key + '/getlast/' + 100).
		success(function(apiData, status, headers, config) {
			chartConfig.series[0].data.length = 0; 
			for(var i =  apiData.length -1; i >=0 ; i--){				
				chartConfig.series[0].data.push([new Date(apiData[i].timestamp).getTime(), apiData[i].execution_time]);
			};
			intervalRef = setInterval(updateChart, 1000);
		}).
		error(function(data, status, headers, config) {
		  	console.log('Could not fetch messages');
		});
    }

    var stopLiveUpdate = function (){
    	clearInterval(intervalRef);
    }

	var setChartData = function(data){
		chartConfig.series = [{data : data}];
	}

	return {
		setChartData : setChartData,
		startLiveUpdate : startLiveUpdate,
		stopLiveUpdate : stopLiveUpdate,
		chartConfig : chartConfig,
		setKey : setKey
	};

})

myApp.service('messageService', function($http, graphService){
	var data = {
		key: 'No Key', 
		messages: [],
		totalMessages: 0,
		messagesTake: 100,
		messagesFrom: 0,
		currentPage: 1,
		dateFrom: '',
		dateTo: '',
	};

	var setKey = function(newKey){
		console.log('Setting key as', newKey);
		data.key = newKey;
		data.currentPage = 1;
		fetchMessages();
		graphService.setKey(data.key);
		graphService.stopLiveUpdate();
		graphService.startLiveUpdate();
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



