'use strict';
angular.module('Tomato.controllers', ['timer'])

/**
 * App Controller
 *
 * Housing controller for our app, lets us use global values and functions.
 */
.controller('AppCtrl', function($scope, $ionicModal, Timers, Options){

	$scope.debug = true;

	/**
	 * Scope flag used for notifying the system whether or not the modal
	 * is editing a timer, or creating a new timer.
	 */
	$scope.editing = false;

	/**
	 * Utility function for generating slugs
	 */
	var convertToSlug = function(string) {
		return string.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
	}

	/**
	 * Get our timer options, for use in creation
	 */
	$scope.timer_lengths = Options.timer_lengths();
	$scope.break_lengths = Options.break_lengths();

	/**
	 * Create and open our new-timer modal.
	 */
	$scope.openModal = function( timer_slug ) {
		/**
		 * Originally we loaded this modal once, and tried to
		 * delete the 'new' object within it.
		 *
		 * That failed, I now create a new IonicModal each time.
		 */
		$ionicModal.fromTemplateUrl('templates/modals/new-timer.html', {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.modal = modal;


			// if you specified a timer
			if (timer_slug) {
				$scope.modal.timer = Timers.get(timer_slug);
				$scope.editing = true;
			} else {
				// Create our new timer
				$scope.modal.timer = Timers.newTimer();

				// Set our timer/break select bindings
				$scope.modal.timer.length = $scope.timer_lengths[0];
				$scope.modal.timer.break = $scope.break_lengths[0];

				$scope.editing = false;
			}

			$scope.modal.show();
		});
	};

	/**
	 * Animates out the modal.
	 */
	$scope.closeModal = function() {
		$scope.modal.hide();
	};

	/**
	 * Saves the data to localstorage, then animates out modal
	 */
	$scope.saveModal = function() {
		var default_timer = Timers.newTimer();

		// Check that we have at least modified the timer title
		if( $scope.modal.timer.title === default_timer.title ) {
			alert("Please enter a title for your timer.");
			return false;
		}

		// When first creating a timer, generate a slug for it
		if ( !$scope.editing ) {
			$scope.modal.timer.slug = convertToSlug($scope.modal.timer.title);
			$scope.timers.push($scope.modal.timer);
			Timers.save($scope.timers);
		}

		Timers.save($scope.timers);

		$scope.modal.hide();

		$scope.editing = false;
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

	/**
	 * Get our timers for use in scope.
	 *
	 * This currently makes them app wide, but I'd prefer this to only exist
	 * on the dash...
	 *
	 * But maybe it should be here too anyway. #devthoughts
	 */
	$scope.timers = Timers.all();

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
.controller('TimerCtrl', function($scope, $stateParams, Timers) {

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
	$scope.timer = Timers.get($stateParams.timerId);
	$scope.timer.length = 1;

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
		console.log(event);
		console.log('Timer Stopped - data = ', data);
	});

})

.controller('AccountCtrl', function($scope) {
});
