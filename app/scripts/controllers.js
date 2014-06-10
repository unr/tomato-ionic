'use strict';
angular.module('Tomato.controllers', [])

/**
 * Timer Dashboard Controller
 *
 * Should list existing timers from localstorage, as well as handle adding new
 * timers to the app.
 */
.controller('DashCtrl', function($scope, $ionicModal, Timers, Options) {

	/**
	 * Get our timer options, for use in creation
	 */
	$scope.timer_lengths = Options.timer_lengths();
	$scope.break_lengths = Options.break_lengths();

	/**
	 * Create and open our new-timer modal.
	 */
	$scope.openNewModal = function() {
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

			// Create our new timer
			$scope.modal.newTimer = Timers.newTimer();

			// Set our timer/break select bindings
			$scope.modal.newTimer.length = $scope.timer_lengths[0];
			$scope.modal.newTimer.break = $scope.break_lengths[0];

			$scope.modal.show();
		});
	};

	/**
	 * Animates out the modal.
	 */
	$scope.closeNewModal = function() {
		$scope.modal.hide();
	};

	/**
	 * Saves the data to localstorage, then animates out modal
	 */
	$scope.saveNewModal = function() {
		var default_timer = Timers.newTimer();

		// Check that we have at least modified the timer title
		if( $scope.modal.newTimer.title === default_timer.title ) {
			alert("Please enter a title for your timer.");
			return false;
		}

		// Add our new timer to the list of timers
		$scope.timers.push($scope.modal.newTimer);

		// Save our timers to local storage
		Timers.save($scope.timers);

		$scope.modal.hide();
	};

	// Grab our existing timers
	$scope.timers = Timers.all();
})

.controller('AccountCtrl', function($scope) {
});
