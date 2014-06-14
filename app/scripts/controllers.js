'use strict';
angular.module('Tomato.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, Timers, Options){

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

	$scope.editTimer = function() {
		$scope.openModal($scope.timer.slug);
	}

	// gets our current views timer
	$scope.timer = Timers.get($stateParams.timerId);

	// Timer running variable, false by default
	$scope.timerRunning = false;

	/**
	 * Start Timer
	 */
	$scope.startTimer = function() {
		$scope.$broadcast('timer-start');
		$scope.timerRunning = true;
	};

	/**
	 * Stop Timer
	 */
	$scope.stopTimer = function() {
		$scope.$broadcast('timer-stop');
		$scope.timerRunning = false;
	};

	/**
	 * Reset our timer length to original_length
	 */
	$scope.resetTimer = function() {
		$scope.timer = undefined;
		$scope.$broadcast('timer-clear');
	};

	/**
	 * fires when the timer ticks.
	$scope.$on('timer-tick', function (event, data){
		$scope.timer.percentage = parseFloat(100 - ($scope.timer.length / $scope.original_length * 100)).toFixed(2);
	});
	 */

	/**
	 * fires when the timer is paused.
	 */
	$scope.$on('timer-stopped', function (event, data){
		console.log('Timer Stopped - data = ', data);
		console.log($scope.timer.length);
	});

})

.controller('AccountCtrl', function($scope) {
});
