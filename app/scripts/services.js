'use strict';
angular.module('Tomato.services', [])

/**
 * A generic placeholder service, holding our option values.
 */
.factory('Options', function(){
	return {
		timer_lengths: function() {
			return [
				{ label : "0:03" , value : 0.05, ms : 3000 },
				{ label : "0:15" , value : 0.25, ms : 15000 },
				{ label : "1:00" , value : 1, ms : 60000 },
				{ label : "5:00" , value : 5, ms : 300000 },
				{ label : "10:00" , value : 10, ms : 600000 },
				{ label : "15:00" , value : 15, ms : 900000 },
				{ label : "20:00" , value : 20, ms : 1200000 },
				{ label : "25:00" , value : 25, ms : 1500000 }
			];
		},
		break_lengths: function() {
			return [
				{ label : "0:03" , value : 0.05, ms : 3000 },
				{ label : "0:15" , value : 0.25, ms : 15000 },
				{ label : "1:00" , value : 1, ms : 60000 },
				{ label : "2:00" , value : 2, ms : 120000 },
				{ label : "3:00" , value : 3, ms : 180000 },
				{ label : "4:00" , value : 4, ms : 240000 },
				{ label : "5:00" , value : 5, ms : 300000 }
			];
		}
	}
})

/**
 * A service for managing our Timers.
 *
 * This will handle reading/writing from localstorage, and de/encoding the
 * json.
 *
 * A timer object should look like:
 *
 * timer = {
 * 		id: int,
 * 		title: string,
 * 		slug: string,
 * 		length: {label, value},
 * 		break: {label, value},
 * 		repeat_count: int,
 * 		repeat: boolean,
 * 		color: string
 * }
 */
.factory('Timers', function() {
	var timers = [];

	/**
	 * Get our timers from localStorage
	 */
	var timerString = window.localStorage['timers'];
	if(timerString) {
		var timers = angular.fromJson(timerString);
	}

	/**
	 * Utility function, to sort timer by id
	 */
	var compare = function(a,b) {
		if (a.id > b.id)
			return -1;
		if (a.id < b.id)
			return 1;
		return 0;
	}

	/**
	 * Utility function, to find timer by ID.
	 */
	var findByID = function(id, array) {
		for( var i = 0 ; i < array.length ; i++ ) {
			if (parseInt(array[i].id) === parseInt(id)) {
				return array[i];
				break;
			}
		}
	}

	/**
	 * Utility function, to find timer by slug
	 */
	var findBySlug = function(slug, array) {
		for( var i = 0 ; i < array.length ; i++ ) {
			if (array[i].slug === slug) {
				return array[i];
				break;
			}
		}
	}

	/**
	 * Utility function for generating slugs
	 */
	var convertToSlug = function(string) {
		return string.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
	}


	/**
	 * Return functions, usable under the Timers.func() namespace
	 */
	return {
		all: function() {
			return timers;
		},
		get: function(timerSlug) {
			return findBySlug(timerSlug, timers);
		},
		save: function(timers) {
			window.localStorage['timers'] = angular.toJson(timers);
		},

		/**
		 * New Timer
		 *
		 * Returns a basic object in Timer structure. This should be used
		 * in the new Timer modal.
		 */
		newTimer: function() {
			var timers_copy = angular.copy(timers),
				highest_index_first = timers_copy.sort(compare),
				currentIndex = 0;

			if ( highest_index_first && highest_index_first[0] ) {
				if ( highest_index_first[0].id ) {
					currentIndex = highest_index_first[0].id;
				}
			}

			return {
				id: parseInt(currentIndex)+1,
				percent: 0,
				state: 'off'
			}
		}
	}
});
