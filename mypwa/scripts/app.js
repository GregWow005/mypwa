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
    var getCountries = function(data,type){
        console.log('Countries: ', data,type);
        /* $.each( data.networks, function( index, obj ){
            if(obj.location.country === 'ES'){
                LocalStorageDataApi.setDataLocalStorage(obj.location.country + '_' + obj.id ,obj);
                //console.log('companny',obj.company,obj.location.city,obj.location.country,obj.name);
            }
        }); */
        //$('body').append(type);
    };
    var getStations = function(data,type){
        console.log('Stations: ', data,type);
        $('body').append(type);
        templates.getCompanyTemplate(data);
    };
    
    return {
        fetchData       :  fetchData,
        getCountries    :  getCountries,
        getStations     :  getStations
        };

})();

var dataAppDDBB = (function(){
    var getCountries = function(countries){
        countries_data = [
            {value: "DE", text: "ALEMANIA"},
            {value: "ES", text: "ESPAÑA"},
            {value: "FR", text: "FRANCIA"}
        ];
        
        if(countries){
            // Reset countries data
            countries_data = []; 
            $.each(countries, function (index, obj) { 
                country_data = {value: obj.code, text: obj.name};
                countries_data.push(country_data);
            });
        }
        var combo_countries = $('.js-target-combo-countries');
        createCombo.built(countries_data,combo_countries,'',templates.getCitiesData);
    };
    var getCities = function(cities){
        console.log('CITIES: ', cities);
    };
    return {
        getCountries : getCountries,
        getCities : getCities
    };
})();
var templates = (function(){
    var getCompanyTemplate = function(result){
		var data = result.networks;
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
        var address = station.extra.address || station.extra.description || '-';
        var status = station.extra.status || station.extra.status.message || 'No Data';
        var template = `<div class="js-stations">
                <header class="card-header">
                    <p class="card-header-title">
                    ${station.name}
                    </p>
                </header>
                <div class="card-content">
                    <div class="content">
                        <div class="column">Addres: ${address + ' ( ' + status +' )'}</div>
                        <div class="column">Free bikes: ${station.free_bikes}</div>
                        <div class="column">Empty Slots: ${station.empty_slots}</div>
                        <div class="column">Last Update: ${time_update}</div>
                    </div>
                </div>
        </div>
        `;
        $('.js-data-station').html(template);
    };

    var getCitiesData = function(obj,text,value){

 /*     - Evento change sobre el combo de los paises.
 *      - Necesito los datos de las ciudades del pais seleccionado.
 *          - Cargarlos via API o via BBDD
 *          - ¿Existen en la BBDD?
 *               - Cargar de la BBDD
 *               - Cargar via API 
 * 
 * createCombo.built(cities_data,$('.js-target-combo-cities'),'',templates.getCitiesTemplate);
 * 
 * */
		transactions.getItem(transactions.dbPromise,'cities',value);
        //transactions.getItem(dbPromise,'cities',value,dataAppDDBB.getCities);
        /* var url = 'http://api.citybik.es/v2/networks';
        var promise = caches.match(url).then(function(response) {
            console.log('RESPONSE: ', response);
            return response || fetch(url);
        });
        promise.then(function(response){
            return response.json();
        }).then( data => { 
            console.log('data.networks: ', data.networks); 
        });
            // Replace ./data.json with your JSON feed
        fetch(url).then(response => {
        return response.json();
        }).then(data => {
            // Work with JSON data here
            let cities = data.networks.filter(obj => obj.location.country === value);
            console.log('CITY: ', cities);
            var cities_data = [];
            var city_data = {};

            $.each(cities, function (index, obj) { 
                city_data = {value: obj.id, text: obj.location.city};
                cities_data.push(city_data);
            });
            createCombo.built(cities_data,$('.js-target-combo-cities'),'',templates.getCitiesTemplate);
        }).catch(err => {
            // Do something for an error here
            console.log('Upsss! ', err);
        }); */
        console.log('getCitiesData: ', obj,text,value);
    };
    var getCitiesTemplate = function(obj,text,value){
        //templates.getCompanyTemplate(cities_data);
        var url = 'http://api.citybik.es/v2/networks/'+ value;
        dataApp.fetchData(url,dataApp.getStations);
        console.log('GETCITIESTEMPLATE: ', obj,text,value);  
    };

    return {
        getCompanyTemplate : getCompanyTemplate,
        getStationData     : getStationData,
        getCitiesData      : getCitiesData,
        getCitiesTemplate  : getCitiesTemplate
    };
})();

var transactions = (function(){
	'use strict';
	if (!('indexedDB' in window)) {
        console.log('This browser doesn\'t support IndexedDB');
        return;
    }
    var dbPromise = idb.open('test-pwa', 1, function(upgradeDb) {
        console.log('Create object store countries');
        if (!upgradeDb.objectStoreNames.contains('countries')) {
            var countries = upgradeDb.createObjectStore('countries',{keyPath: 'code'});
            countries.createIndex('code', 'code', { unique : true});
            countries.createIndex('name', 'name', { multiEntry : true});
		}
		console.log('Create object store cities');
		if (!upgradeDb.objectStoreNames.contains('cities')) {
			var cities = upgradeDb.createObjectStore('cities',{keyPath: 'code'});
			cities.createIndex('code', 'code', { unique : true});
		}
    });
    var createCountries = function(dbPromise){
        dbPromise.then(function(db) {
            var tx = db.transaction('countries', 'readwrite');
            var store = tx.objectStore('countries');
            var items = [
                {code: 'ES', name:'ESPAÑA'},
                {code: 'DE', name:'ALEMANIA'},
                {code: 'FR', name: 'FRANCIA'}
            ];
            return Promise.all(items.map(function(item) {
                console.log('Adding item: ', item);
                return store.add(item);
                })
            ).catch(function(e) {
                tx.abort();
                console.log(e);
            }).then(function() {
                console.log('All items added successfully!');
            });
        });
	};
	
	var createCities = function(dbPromise,item,fn){
		console.log('MSG',item);
        dbPromise.then(function(db) {
            var tx = db.transaction('cities', 'readwrite');
            var store = tx.objectStore('cities');
			store.add(item);
			createCombo.built(item.value,$('.js-target-combo-cities'),'',templates.getCitiesTemplate);
			return tx.complete;
        }).then(function(item) {
			console.log('All items added successfully!',item);
			fn('OK!')
        });
    };

	var ok = function(msg){
		console.log('msg',msg);
	};

    var getAllitems = function(dbPromise,obj_store,fn){
        dbPromise.then(db => {
            return db.transaction(obj_store)
            .objectStore(obj_store).getAll();
        }).then(allObjs => 
            { 
                fn(allObjs);
            }
        ); 
    };

    var getItem = function(dbPromise,obj_store,index,fn){
        dbPromise.then(db => {
            return db.transaction(obj_store)
                .objectStore(obj_store).get(index);
        }).then(obj => {
                //fn(obj);
				if(typeof obj !== 'undefined'){
					console.log('item: ',obj);
					createCombo.built(obj.value,$('.js-target-combo-cities'),'',templates.getCitiesTemplate);
				} else {
					/**
					 * No existe los datos en la BBDD asi que acusimos a la API
					 * Obtenmos datos de la API
					 * Guardamos datos en base de datos
					 * Pintamos template
					 * 
					 * Estructura en la base de datos - JSON 
					 * 	Clave - Código del pais
					 * 	Valor - Array de JSON con los datos de las ciudades de ese pais
					 * 	 Ej.:´
					 *  { 'ES' : [{},{}}}
					 * 
					 * TODO - EXPERT - Comprobar que todas las ciudades en la BBDD son las mismas que las que 
					 * existe en la API. Verificar las actualizaciones
					 * 	 
					 * 	
					 * 
					 * 
					 */
					var url = 'http://api.citybik.es/v2/networks/';
					fetch(url).then(response => {
						return response.json();
						}).then(data => {
							// Work with JSON data here
							let cities = data.networks.filter(obj => obj.location.country === index);
							var cities_data = [];
							var city_data = {};
							
							$.each(cities, function (index, obj) { 
								city_data = {index: obj.id, text: obj.location.city};
								cities_data.push(city_data);
							});
							var cities_bbdd = {
								'code' : index,
								'value' :cities_data
							};
							// Guardamos en la base de datos las ciudades
							console.log('cities_bbdd: ', cities_bbdd);
							transactions.createCities(transactions.dbPromise,cities_bbdd,transactions.ok);
						}).catch(err => {
							// Do something for an error here
							console.log('Upsss! ', err);
						});
				}
            }
        ).catch(error => {
			
			console.log('error: ',error);
		});
    };

    var getCursor = function(dbPromise,obj_store,index){
        dbPromise.then(function(db) {
            var tx = db.transaction(obj_store, 'readonly');
            var store = tx.objectStore(obj_store);
            return store.openCursor();
        }).then(function logItems(cursor) {
            if (!cursor) {
              return;
            }
            console.log('Cursored at:', cursor.key);
            for (var field in cursor.value) {
              console.log('CURSOR: ',field,cursor.value[field]);
            }
            return cursor.continue().then(logItems);
        }).then(function() {
            console.log('Done cursoring');
        });

    };
    return {
		dbPromise 		: dbPromise,
        createCountries	: createCountries,
        getAllitems    	: getAllitems,
        getItem        	: getItem,
		getCursor      	: getCursor,
		createCities 	: createCities,
		ok : ok
    };
})();


//Document Ready
(function() {
  'use strict';
    
	transactions.createCountries(transactions.dbPromise);
    //transactions.getItem(dbPromise,'countries','ES',console.log);
    //transactions.getCursor(dbPromise,'countries','ESPAÑA');
    
    //Get Coutries 
    transactions.getAllitems(transactions.dbPromise,'countries',dataAppDDBB.getCountries);
    
	// TODO add service worker code here
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker
		.register('./service-worker.js')
		.then(function() { 
			//console.log('Service Worker Registered'); 
		});
	}
})();



/**
 * 
 * * 
 * Al cargar la página
 *   - Necesito los datos de los paises.
 *       - Cargarlos via API o cargarlos via BBDD
 *          - Es este caso están harcodeados como ejemplo y guardados en la BBDD 
 *   - Evento change sobre el combo de los paises.
 *      - Necesito los datos de las ciudades del pais seleccionado.
 *          - Cargarlos via API o via BBDD
 *          - ¿Existen en la BBDD?
 *               - Cargar de la BBDD
 *               - Cargar via API
 *  - Evento change sobre el combo ciudades
 *      - Necesito los datos de las estaciones de la ciudad seleccionada
 *          - Cargarlos via API o via BBDD 
 *          - ¿Existen en la BBDD?
 *               - Cargar de la BBDD
 *               - Cargar via API
 * 
 * 
 * 
 * 
 * 
 * Hacerlo que funcione cómo sabes
 * Usar nuevas tecnologías y adaptarlos
 * Optimizarlo
 * 
 * Evento Activate del Service Worker
 * - Crear base de datos o abrirla si ya existe
 *      - Obtener datos de la base de datos o de la red 
 * 
 * 
 * BBDD
 * 
 * Countries
 *          - Ej:
 *              {
 *                  code: '', -- Keypath
 *                  name     : '',
 *              }
 * Cities
 *   - Por paises
 *       - keypath -> Country_code -- lo saco de la API
 *          - Ej:
 *              {
 *                  company     : '',
 *                  href        : '',
 *                  id          : '',
 *                  city        : '',
 *                  country_code: '', -- Keypath
 *                  country     : '',
 *                  name        : '',
 *              }
 * Stations
 *      - Keypath -> city_code -- Lo saco de la API
 *           - Ej:
 *              {
 *                  empty_slots: '',
 *                  free_bikes : '',
 *                  timestam   : '',
 *                  id         : '',
 *                  latitude   : '',
 *                  longitude  : '',
 *                  addres     : '',
 *                  status     : '',
 *                  city_code  : '' --> Keypath
 * 
 *              }
 * 
 * 
 * SECCIONES
 *  - Select de paises
 *      - BBDD -> Listado de paises
 *      - Change select -> devuelve listado de estaciones en el pais
 *  - Select Ciudades
 *  - Change Select
 *      - BBDD -> Listado de ciudades
 *      - Template_Ficha -> Ficha con cada uno de las estaciones de esa ciudad
 *          - Datos
 *              - BBDD
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
 *      Countries
 *           - De momento estarán harcodeadas. Solo tres ciudades como muestra
 *      Stations
 *          - Actualizaciones de empty_slots, free_bykes y timestamp
 *    
 * 
 * 
 * 
 
 * 
 */


