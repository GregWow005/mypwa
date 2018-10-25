moment.locale('es');
var createCombo = (function(){
    /**
     * author -- Greg
     * @param {* array } dataCombo 
     * @param {* DOM object } target 
     * @param {* valur for selected option} value 
     */
    var built = function(dataCombo,target,value,fn){
        target.html('');
        var array = new Uint32Array(1);
        var combo_class = 'js-combo-' + window.crypto.getRandomValues(array);
        var select_element = $('<select class="' + combo_class + '"></select>');
        /**
         * dataCombo structure
         * option.value -- option value
         * option.text  -- option text
         */
        if(dataCombo === null){
            select_element.append($('<option>Seleccione valor</option>').prop('disabled',true));
        } else {
            select_element.append($('<option>Seleccione valor</option>'));
            $.each(dataCombo, function (id, option) {
                var selected = '';
                //console.log(' TRIGGER: ', parseInt(value) === option.id, value,option.id,option.value);
                if(typeof value !== undefined && (parseInt(value) === parseInt(option.value))){
                    selected = "selected";
                }
                select_element.append($('<option ' + selected + '></option>').val(option.value).html(option.text));
            });
        }
        target.html(select_element);
        $(target).on('change','.' + combo_class,{fn:fn},function(e){
            var this_combo = $(e.currentTarget);
            fn(this_combo,this_combo.children(':selected').text(),this_combo.val());
            //console.log('COMMENT: ', this_combo.children(':selected').text(),'-->',this_combo.val());
        });
    };

    var getData = function(obj,text,value){
        console.log('getData: ', obj,text,value);
    };
    return {
        built   : built,
        getData : getData
    };
})();

var LocalStorageDataApi = (function(){

    var getDataLocalStorage = function(item){
        window[item] = localStorage.getItem(item) ? JSON.parse(localStorage.getItem(item)) : window[item] ;
        return window[item];
    };
    var setDataLocalStorage = function(item,data){
        //localStorage.clear();
        localStorage.setItem(item, JSON.stringify(data));
    };
    return {
        getDataLocalStorage     : getDataLocalStorage,
        setDataLocalStorage     : setDataLocalStorage
    };
    
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
    
    var  getCities = function(){
        var url = 'http://api.citybik.es/v2/networks';
            // Replace ./data.json with your JSON feed
        fetch(url).then(response => {
        return response.json();
        }).then(data => {
            // Work with JSON data here
            $.each( data.networks, function( index, obj ){
                if(obj.location.country === 'ES'){
                    LocalStorageDataApi.setDataLocalStorage(obj.location.country + '_' + obj.id ,obj);
                    //console.log('companny',obj.company,obj.location.city,obj.location.country,obj.name);
                }
            });
            
        }).catch(err => {
            // Do something for an error here
            console.log('Upsss! ', err);
        });
    };
    getCities();

    var  getCompanies = function(){
        var url = 'http://api.citybik.es/v2/networks/bicimad';
            // Replace ./data.json with your JSON feed
        fetch(url).then(response => {
        return response.json();
        }).then(data => {
            // Work with JSON data here
            var obj = data.network;
            console.log('companny',obj.company,obj.location.city,obj.location.country,obj.name);
        }).catch(err => {
            // Do something for an error here
            console.error('Upsss! ', err);
        });
    };
    getCompanies();

	return {
		fetchData : fetchData,
	};
})();

var dataApp = (function(){
    var fetchData = function(url,fn){
        var networkDataReceived = false;
        // fetch fresh data
        var networkUpdate = fetch(url).then(function(response) {
            return response.json();
        }).then(function(data) {
            networkDataReceived = true;
            fn(data,'NETWORK');
        });
        
        // fetch cached data
        caches.match(url).then(function(response) {
            if (!response) throw Error("No data");
            return response.json();
        }).then(function(data) {
            // don't overwrite newer network data
            if (!networkDataReceived) {
                fn(data,'CACHES');
            }
        }).catch(function() {
            // we didn't get cached data, the network is our last hope;  
            return networkUpdate;
        }).catch(function(err){
            console.log('error: ', err);
        });
    };
    var getCities = function(data,type){
        console.log('Cities: ', data,type);
        $.each( data.networks, function( index, obj ){
            if(obj.location.country === 'ES'){
                LocalStorageDataApi.setDataLocalStorage(obj.location.country + '_' + obj.id ,obj);
                //console.log('companny',obj.company,obj.location.city,obj.location.country,obj.name);
            }
        });
        $('body').append(type);
    };
    var getStations = function(data,type){
        console.log('Stations: ', data,type);
        $('body').append(type);
        templates.getCompanyTemplate(data);
    };
    
    return {
        fetchData  : fetchData,
        getCities  : getCities,
        getStations: getStations
    };

})();

var templates = (function(){
    var getCompanyTemplate = function(result){
        var data = result.network;
        console.log('getCompanyTemplate',data);
        var template = `<div class="card">
        
        <div class="card-content">
          <div class="media">
            <div class="media-left">
              <figure class="image is-48x48">
                <img src="https://bulma.io/images/placeholders/96x96.png" alt="Placeholder image">
              </figure>
            </div>
            <div class="media-content">
              <p class="title is-4">${data.company}</p>
              <p class="subtitle is-6">${data.name}</p>
            </div>
          </div>
      
          <div class="content">
            <div class="columns is-multiline is-mobile is-gapless">
                <div class="column js-select-stations"></div>
                ${data.stations.map(obj => `<!--<div class="column is-one-quarter">${obj.name}</div>-->`).join('')} 
            </div>
          </div>
          <div class="js-data-station"></div>
        </div>
      </div>`;

        $('.js-card-stations').html(template);
        console.log('_STATIONS: ', data.id + '_stations');
        var stations_data = [];
        if(typeof LocalStorageDataApi.getDataLocalStorage(data.id + '_stations')  === 'object'){
            LocalStorageDataApi.getDataLocalStorage(data.id + '_stations').map(obj => stations_data.push({'value':obj.id,'text':obj.name}));
        } else {
            data.stations.map(obj => stations_data.push({'value':obj.id,'text':obj.name}));
            LocalStorageDataApi.setDataLocalStorage(data.id + '_stations',data.stations);
        }
        var select_stations = $('.js-select-stations');
        select_stations.data('companyid',data.id);
        createCombo.built(stations_data,select_stations,'',templates.getStationData);
    };

    var getStationData = function(obj,text,value){
        var parent_select = obj.closest('.js-select-stations');
        var company_stations = parent_select.data('companyid') + '_stations';
        var station = LocalStorageDataApi.getDataLocalStorage(company_stations).find(
            elem => {
                if(elem.id === value){
                    return true;
                }
                return false;
            }
        );
        console.log('templates getData: ', obj,text,value,parent_select.data('companyid'),station);
        getStationTemplate(station);
    };
    var getStationTemplate= function(station){
        var time_update = moment(station.timestamp).format("YYYY-MM-DD HH:mm");
        var template = `<div class="js-stations">
                <header class="card-header">
                    <p class="card-header-title">
                    ${station.name}
                    </p>
                </header>
                <div class="card-content">
                    <div class="content">
                        <div class="column">Free bikes: ${station.free_bikes}</div>
                        <div class="column">Empty Slots: ${station.empty_slots}</div>
                        <div class="column">Last Update: ${time_update}</div>
                    </div>
                </div>
        </div>
        `;
        $('.js-data-station').html(template);
    };

    return {
        getCompanyTemplate : getCompanyTemplate,
        getStationData : getStationData
    };
})();

dataApp.fetchData('http://api.citybik.es/v2/networks',dataApp.getCities);
dataApp.fetchData('http://api.citybik.es/v2/networks/norisbike-nurnberg',dataApp.getStations);

var app = {
  /* isLoading: true,
  visibleCards: {},
  selectedCities: [],
  spinner: document.querySelector('.loader'),
  cardTemplate: document.querySelector('.cardTemplate'),
  container: document.querySelector('.main'),
  addDialog: document.querySelector('.dialog-container'),
  daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] */
  cities : []
};

//Document Ready
(function() {
  'use strict';
    app.cities = localStorage.cities;
    if (app.cities) {
        app.cities = JSON.parse(app.cities);
        app.cities.forEach(function(city) {
            console.log('city',city);
        });
    } else {
        app.cities = [
            {value: 'ES', text:'ESPAÑA'},
            {value: 'DE', text:'ALEMANIA'},
            {value: 'FR', text: 'FRANCIA'}
        ];
        LocalStorageDataApi.setDataLocalStorage('cities',app.cities);
    }
    //Create combo cities
    var combo_cities = $('.js-target-combo');
    createCombo.built(app.cities,combo_cities,'',createCombo.getData);
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
   

	// TODO add service worker code here
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker
		.register('./service-worker.js')
		.then(function() { 
			//console.log('Service Worker Registered'); 
		});
	}
})();




//fetchResource.fetchData('http://placekitten.com/290/207');
//fetchResource.fetchData('http://api.citybik.es/v2/networks/bicimad');
  

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

/* getJSON('http://placekitten.com/290/207',playBLOB);
getJSON('http://api.citybik.es/v2/networks/bicimad',playJSON); */





/**
 * SECCIONES
 *  - Select en el header con las ciudades
 *  - Change Select
 *      - Template_Ficha -> Ficha con cada uno de las estaciones de esa ciudad
 *          - Datos
 *              - Company
 *              - location.city
 *              - location.country
 *              - name
 *          - Click en ficha 
 *              -  Template_Station -> Ficha con la estación seleccionada
 *                  - Datos
 *                      - empty_slots
 *                      - free_bikes
 *                      - name
 *                      - latitude
 *                      - longitude
 *                      - timestamp
 *                      - Mapa --> Más adelanta
 * 
 * 
 *  Pattern
 *      Cache then Network
 *      Cities
 *           - De momento estarán harcodeadas. Solo tres ciudades como muestra
 *      Stations
 *          - Actualizaciones de empty_slots, free_bykes y timestamp
 *    
 */


