// Copyright 2016 Google Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


(function() {
  'use strict';

  var app = {
    isLoading: true,
    visibleCards: {},
    selectedCities: [],
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container'),
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  };


  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  /* document.getElementById('butRefresh').addEventListener('click', function() {
    
  }); */



  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/
  var app = {
	  cities : []
  };

  app.cities = localStorage.cities;
  if (app.cities) {
    app.cities = JSON.parse(app.cities);
    app.cities.forEach(function(city) {
		console.log('city',city);
    });
  } else {
    /* The user is using the app for the first time, or the user has not
     * saved any cities, so show the user some fake data. A real app in this
     * scenario could guess the user's location via IP lookup and then inject
     * that data into the page.
     */
    //app.updateForecastCard(initialWeatherForecast);
    app.cities = [
      {key: initialWeatherForecast.key, label: initialWeatherForecast.label}
    ];
  }

  app.saveCities = function() {
	app.cities.forEach(function(city) {
		console.log('city',city);
	});
	fetchResource.fetchData('http://api.citybik.es/v2/networks/bicimad');

    var selectedCities = JSON.stringify(app.selectedCities);
    localStorage.cities = selectedCities;
  };


	// TODO add service worker code here
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker
		.register('./service-worker.js')
		.then(function() { 
			console.log('Service Worker Registered'); 
		});
	}
})();


var fetchResource = (function(){
	function logResult(result) {
		console.log(result);
	}
	
	function logError(error) {
		console.log('Looks like there was a problem: \n', error);
	}
	
	function validateResponse(response) {
	if (!response.ok) {
		throw Error(response.statusText);
		}
		return response;
	}
	
	function readResponseAsJSON(response) {
		var response_data = response.clone();
		var promise = response.blob();
		promise.then(function(data) {
			switch (data.type) {
				case "image/jpeg":
					getBLOB(response_data.blob());
					break;
				case "application/json":
					getJSON(response_data.json());
					break;
			
				default:
					break;
			}
		  }, function(err) {
			console.log("Failed!", err); // Error: "It broke"
		  });
	}

	var getBLOB = function(response){
		response.then(function(data) {
			console.log("Success BLOB!", data); // "Stuff worked!"
		  }, function(err) {
			console.log("Failed!", err); // Error: "It broke"
		  });
	};

	var getJSON = function(response){
		return response;
		/* response.then(function(data) {
			console.log("Success JSON!", data); // "Stuff worked!"
			window.data = data;
			return window.data;
		}, function(err) {
			console.log("Failed!", err); // Error: "It broke"
		}); */
	};
	
	function fetchData(pathToResource) {
		return fetch(pathToResource) // 1
		.then(validateResponse) // 2
		.then(readResponseAsJSON) // 3
		.catch(logError);
	}

	return {
		fetchData : fetchData,
	};
})();



//fetchResource.fetchData('http://placekitten.com/290/207');
//fetchResource.fetchData('http://api.citybik.es/v2/networks/bicimad');
  





var url = 'http://api.citybik.es/v2/networks/bicimad';
// Replace ./data.json with your JSON feed
var a = fetch(url).then(response => {
  return response.json();
}).then(data => {
  // Work with JSON data here
  return data;
}).catch(err => {
  // Do something for an error here
});


var newFetch = (function(){
	
	var getData = function(url){
		var promise = '';
		return fetch(url).then(response => {
			//console.log("Success JSON!", response); // "Stuff worked!"
			var result = '';
			var response_clone = response.clone();
			promise  = response.blob();
			console.log(promise);
			promise.then(function(data) {
				console.log(data.type);
				switch (data.type) {
					case "image/jpeg":
						result = response_clone.blob();
						break;
					case "application/json":
						result = response_clone.json();
						break;
					case "text/html":
						result = response_clone.json();
						break;
						
					default:
						break;
				}
				return result;
			  }, function(err) {
				console.log("Failed!", err); // Error: "It broke"
			  });
		  }).then(data => {
			// Work with JSON data here
			return data;
		  }).catch(err => {
			// Do something for an error here
		  });
	};

	return {
		getData : getData
	};
})();
var getJSON = function(url,fn){
	newFetch.getData(url).then(function(data) {
		console.log('this' ,data)
		fn(data);
	}, function(err) {
		console.log("Failed!", err); // Error: "It broke"
	});
};
var playJSON = function(data){
	console.log('data JSON',data);
};

var playBLOB = function(data){
	console.log('data BLOB',data);
};

getJSON('http://placekitten.com/290/207',playBLOB);
getJSON('http://api.citybik.es/v2/networks/bicimad',playJSON);
