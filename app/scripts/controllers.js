'use strict';
angular.module('Tomato.controllers', ['timer'])

/**
 * App Controller
 *
 * Housing controller for our app, lets us use global values and functions.
 */
.controller('AppCtrl', function($scope, $rootScope, $ionicModal, Timers, Options){

	/**
	 * Should be set to false, when building for production. This will show
	 * debug events in console.
	 */
	$scope.debug = true;

	/**
	 * Whether or not we are 'editing' an item flag. Used for saving modals
	 * and making decisions during edit flows.
	 */
	$scope.editing = false;

	/**
	 * Get our timers for use in scope.
	 *
	 * This currently makes them app wide, but I'd prefer this to only exist
	 * on the dash...
	 *
	 * But maybe it should be here too anyway. #devthoughts
	 */
	$scope.timers = Timers.all();

	/**
	 * Utility function for generating slugs
	 *
	 * These aren't used visually, to create a sense of uniqueness
	 * I will apply a number of 1-10 at the end of a slug.
	 */
	var convertToSlug = function(string) {
		var bonus_number = Math.floor(Math.random() * 6) + 1;
		return string.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-')+bonus_number;
	}

	/**
	 * Utility function for finding the index of a timer based
	 * on its slug.
	 */
	var getTimerIndexBySlug = function( timer_slug ) {
		var length = $scope.timers.length;
		for (var i = 0; i < length; i++) {
			if( ($scope.timers[i].slug === timer_slug ) ) {
				return i;
			}
		}
		return false;
	}

	/**
	 * Get our timer options, for use in creation
	 */
	$scope.timer_lengths = Options.timer_lengths();
	$scope.break_lengths = Options.break_lengths();

	/**
	 * New Timer Modal
	 *
	 * This will launch the modal with a new timer entered in scope.
	 */
	$scope.newTimerModal = function() {
		$scope.modal = null;

		// this is new, not editing
		$scope.editing = false;

		/**
		 * When called, lets generate a new instance of scope.modal.
		 */
		$ionicModal.fromTemplateUrl("templates/modals/timer-new.html", {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.modal = modal;

			$scope.modal.timer = Timers.newTimer();

			$scope.modal.show();

			if ($scope.debug) {
				console.log("New Timer Modal launched::");
				console.log($scope.modal);
			}
		});
	}

	$scope.editTimerModal = function( timer_slug ) {
		$scope.modal = null;

		$scope.editing = true;

		if (!timer_slug) {
			return false;

			if ($scope.debug) {
				console.log("Error: No timer_slug passed to $scope.editTimerModal();")
			}
		}

		/**
		 * When called, lets generate a new instance of scope.modal.
		 */
		$ionicModal.fromTemplateUrl("templates/modals/timer-edit.html", {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.modal = modal;

			// we make a copy, so our edits aren't immediate
			$scope.modal.timer = angular.copy(Timers.get(timer_slug));

			$scope.modal.show();

			if ($scope.debug) {
				console.log("Timer passed to modal::");
				console.log(timer_slug);
				console.log("Modal launched::");
				console.log($scope.modal);
			}
		});
	}

	/**
	 * Animates out the modal.
	 */
	$scope.closeModal = function() {
		$scope.modal.hide();
		$scope.modal.timer = undefined;

		$scope.editing = false;
	};

	/**
	 * Saves the data to localstorage, then animates out modal
	 */
	$scope.saveModal = function() {
		var default_timer = Timers.newTimer();

		/**
		 * TODO: This should be abstracted to a validation function
		 *
		 * It is wrapped in an if, purely for visual appearance
		 * to make me remove it later.
		 */
		if (true) {
			// Check that we have at least modified the timer title
			if( $scope.modal.timer.title === default_timer.title ) {
				alert("Please enter a title for your timer.");
				return false;
			}

			/**
			 * If we don't have a length selected, warn user
			 *
			 * Temporary validation
			 */
			if( $scope.modal.timer.length === undefined) {
				alert("Please select a length for your timer.");
				return false;
			}

			/**
			 * If we don't have a length selected, warn user
			 *
			 * Temporary validation
			 */
			if( $scope.modal.timer.break === undefined) {
				alert("Please select a length for your break.");
				return false;
			}
		}

		/**
		 * If our timer doesn't have a slug, ensure it has one.
		 */
		if ( !$scope.modal.timer.slug ) {
			$scope.modal.timer.slug = convertToSlug($scope.modal.timer.title);
		}

		/**
		 * If we are not editing, this is a new timer.
		 *
		 * We need to add this timer to our model.
		 */
		if ( !$scope.editing ) {
			$scope.timers.push($scope.modal.timer);

		/**
		 * If we are editing, we need to copy our duplicate timer,
		 * back over itself to preserve our edits.
		 */
		} else {
			console.log($scope.timers);

			// gets the current timer index
			var index_to_update = getTimerIndexBySlug($scope.modal.timer.slug);

			$scope.timers[index_to_update] = angular.copy($scope.modal.timer);
			$rootScope.timer = angular.copy($scope.modal.timer);

			console.log($scope.timers);
		}

		Timers.save($scope.timers);

		$scope.modal.hide();
	};

	/**
	 * DELETE FOR PROD,
	 *
	 * utility function to delete all timers
	 */
	$scope.deleteAllTimers = function() {
		$scope.timers = [];
		Timers.save($scope.timers);
	}

})

/**
 * Timer Dashboard Controller
 *
 * Should list existing timers from localstorage, as well as handle adding new
 * timers to the app.
 */
.controller('DashCtrl', function($scope, Timers) {


})

/**
 * Single Timer Controller
 *
 * When viewing a single timer, controls the start/stop and editing
 * of the timer.
 */
.controller('TimerCtrl', function($scope, $rootScope, $stateParams, Timers) {

	var minutesToMilliseconds = function(minutes) {
		return minutes*60000;
	}

	/**
	 * Utility function for adding minutes to time
	 */
	var addMinutes = function(date_obj, minutes) {
	    return new Date(date_obj.getTime() + minutesToMilliseconds(minutes));
	}

	/**
	 * Utility function for adding milliseconds to time
	 */
	var addMilliseconds = function(date_obj, milliseconds) {
	    return new Date(date_obj.getTime() + milliseconds);
	}

	/**
	 * Start Angular Timer, Utility Function
	 */
	var startTimer = function() {
		$scope.$broadcast('timer-start');
		$scope.timer_running = true;
	};

	/**
	 * Stop Angular Timer, Utility Function
	 */
	var stopTimer = function() {
		$scope.$broadcast('timer-stop');
		$scope.timer_running = false;
	};

	/**
	 * clear Angular Timer, Utility Function
	 */
	var clearTimer = function() {
		$scope.$broadcast('timer-clear');
	};


	// gets our current views timer
	$rootScope.timer = Timers.get($stateParams.timerId);

	// Timer is not set until begin is hit first time
	$scope.timer_set = false;

	// Timer running variable, false by default
	$scope.timer_running = false;

	// time remaining variable, 0 by default
	$scope.timer_remaining = 0;

	/**
	 * Edit timer
	 *
	 * Opens the current scopes timer in a modal for editing.
	 */
	$scope.editTimer = function() {
		$scope.openModal($scope.timer.slug);
	}

	/**
	 * Begin Timer
	 *
	 * Sets up the timer attributes, and then runs start timer
	 */
	$scope.beginTimer = function() {

		// The timer will begin counting down from now
		$scope.timer_started = new Date();

		/**
		 * If the timer was paused, and there is timer_remaining
		 * available.
		 *
		 * Start a new timer, and replace timer.length with
		 * timer_remaining.
		 */
		console.log($scope.timer_remaining);
		if ( $scope.timer_remaining > 0 ) {
			$scope.timer_should_end = addMilliseconds($scope.timer_started, $scope.timer_remaining);
		} else {
			$scope.timer_should_end = addMinutes($scope.timer_started, $scope.timer.length);
		}

		$scope.timer_set = true;

		// converts our timer values to unix, for use in view
		$scope.timer_start_time = $scope.timer_started.getTime();
		$scope.timer_end_time = $scope.timer_should_end.getTime();

		startTimer();

	};

	/**
	 * Stop Timer
	 */
	$scope.pauseTimer = function() {
		// Timestamp when we stopped the timer, for use when continuing it
		$scope.timer_stopped = new Date();

		// Difference in ms, in order to unpause timer
		$scope.timer_remaining = $scope.timer_should_end - $scope.timer_stopped;

		stopTimer();

	};

	/**
	 * Resets timer difference
	 *
	 * When timer_remaining is set to 0, the next loop of beginTimer
	 * will start with the original timer value again.
	 *
	 */
	$scope.resetTimer = function() {
		clearTimer();

		$scope.timer_remaining = 0;

		$scope.timer_set = false;
	};

	/**
	 * A 'tick' event from the angular-timer, however this seems to wait
	 * until the timer stops to finish updating events.
	 *
	 * Doesn't play nice with our intentions.
	$scope.$on('timer-tick', function (event, data){
	});
	 */

	/**
	 * fires when the timer is paused.
	 */
	$scope.$on('timer-stopped', function (event, data){
		if ($scope.debug) {
			console.log(event);
			console.log('Timer Stopped - data = ', data);
		}
	});

})

.controller('AccountCtrl', function($scope) {
});
