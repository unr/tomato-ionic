'use strict';
/**
 * Global function for easily using the scopy apply wrapper.
 *
 * Pass arguments to this that aren't being applied nicely, so we can update
 * them by force.
 *
 * TODO: Move this to a utils.js file for global util functions.
 */
var _apply = function( to_apply ) {
	/**
	 * Using scope.$$phase is a bad pattern, but it will prevent my
	 * issue for now.
	 *
	 * TODO remove this before it causes an issue
	 * http://stackoverflow.com/a/12859093/196822
	 */
	if (typeof($scope) != 'undefined' && !$scope.$$phase) {
		$scope.$apply(function(){
			to_apply;
		});
	} else {
		to_apply;
	}
}

/**
 * Utility classes for manipulating classes.
 */
var _hasClass = function(ele,cls) {
	return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}
var _addClass = function(ele,cls) {
	if (!_hasClass(ele,cls)) ele.className += " "+cls;
}
var _removeClass = function(ele,cls) {
	if (_hasClass(ele,cls)) {
		var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		ele.className=ele.className.replace(reg,' ');
	}
}


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
	$scope.debug_log_percent = false;

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
	$rootScope.timer_lengths = Options.timer_lengths();
	$rootScope.break_lengths = Options.break_lengths();

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

			$scope.modal.timer.length = $rootScope.timer_lengths[0];
			$scope.modal.timer.break = $rootScope.break_lengths[0];

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
			$scope.modal.timer = angular.copy($scope.timer);
			//$scope.modal.timer = $rootScope.timer;

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
			// gets the current timer index
			var index_to_update = getTimerIndexBySlug($scope.modal.timer.slug);

			$scope.timers[index_to_update] = angular.copy($scope.modal.timer);
			$rootScope.timer = angular.copy($scope.modal.timer);
		}

		Timers.save($scope.timers);

		$scope.modal.hide();
	};

	/**
	 * utility function to delete all timers
	 */
	$scope.deleteAllTimers = function() {
		if ($scope.debug) {
			$scope.timers = [];
			Timers.save($scope.timers);
		}
	}

})

/**
 * Timer Dashboard Controller
 */
.controller('DashCtrl', function($scope, $rootScope, Timers) {

	// Dashboard view should nuke selected timer
	$rootScope.timer = {};

})

/**
 * Single Timer Controller
 *
 * When viewing a single timer, controls the start/stop and editing
 * of the timer.
 */
.controller('TimerCtrl', function($scope, $rootScope, $timeout, $stateParams, Timers) {

	/**
	 * Set up our timer for this view.
	 *
	 * Gets put on $rootScope in order to be available for AppCtrl modal events
	 */
	$rootScope.timer = Timers.get($stateParams.timerId);

	/**
	 * A simple function to set all the standard view defaults back to 0.
	 *
	 * Called once when the view is entered, and again when a timer is complete.
	 */
	$scope.restoreDefaults = function() {
		$scope.timer_running = false;
		$scope.timer_set = false;
		$scope.break_timer_set = false;
		$scope.chart_set = false;
		$scope.timer.remaining = 0;
		$scope.timer.percentage = 0;
		$scope.timer.break_percentage = 100;
		$scope.timer.state = 'off';
	}

	/**
	 * Set up our default variables
	 */
	$scope.restoreDefaults();

	/**
	 * Utility function that converts minutes to milliseconds
	 */
	var minutesToMilliseconds = function(minutes) {
		return minutes*60000;
	}

	/**
	 * Utility function for adding minutes to time
	 */
	var addMinutes = function(date_obj, minutes) {
	    return new Date(date_obj.getTime() + minutesToMilliseconds(minutes) + 1000);
	}

	/**
	 * Utility function for adding milliseconds to time
	 */
	var addMilliseconds = function(date_obj, milliseconds) {
	    return new Date(date_obj.getTime() + milliseconds);
	}

	/**
	 * Utility function that calculates percent of timer left
	 */
	var getPercentage = function(current_millis, timer_millis) {
		var percentage = current_millis / timer_millis * 100;
		if (percentage < 0) { percentage = 0; }
		if (percentage > 0 && percentage < 1) { percentage = 1; }
		if (percentage > 100) { percentage = 100; }
		return parseFloat( percentage.toFixed(2) );
	}

	/**
	 * Utility function that calculates inverse percent of timer left
	 * ie, instead of getting 100-0%, will get 0-100%
	 */
	var getInversePercentage = function(current_millis, timer_millis) {
		var percentage = 100 - (current_millis / timer_millis * 100);
		if (percentage < 0) { percentage = 0; }
		if (percentage > 0 && percentage < 1) { percentage = 1; }
		if (percentage > 100) { percentage = 100; }
		return parseFloat( percentage.toFixed(2) );
	}

	/**
	 * Stop Angular Timer, Utility Function
	 */
	var stopTimer = function() {
		$scope.timer_stopped_last = new Date();
		$scope.timer.remaining = $scope.timer_should_end - $scope.timer_stopped_last;
		$scope.timer_running = false;
		$scope.$broadcast('timer-stop');
	};

	/**
	 * Passes the current timer percent to the chart.
	 */
	var updateChart = function(load) {
		if ( $scope.chart_set ) {
			load = typeof load !== 'undefined' ? load : $scope.timer.percent;
			$scope.timer_chart.load({
				columns: [ ['data', load] ]
			});
		}
	}

	/**
	 * Called when timer-next is updated
	 *
	 * Will set the appropriate style if the break timer is active.
	 */
	var updateChartClass = function() {
		var chartDiv = document.getElementById('chart-div');
		if ( $scope.timer.state === "break_timer" ) {
			_addClass(chartDiv, 'break-active');
			_removeClass(chartDiv, 'timer-active');
		} else {
			_addClass(chartDiv, 'timer-active');
			_removeClass(chartDiv, 'break-active');
		}
	}

	/**
	 * Show chart, utility function
	 *
	 * Used to create the chart element on the timer
	 */
	var createChart = function() {
		if ( !$scope.chart_set ){
			$scope.chart_set = true;

			$scope.timer_chart = c3.generate({
				bindto: '#timer-chart',
				data: {
					columns: [ ['data', 0] ],
					type: 'gauge'
				},
				legend: false,
				gauge: {
					label: {
						show: false
					},
					min: 0,
					max: 100,
					width: 5,
					color: {
						pattern: ['#4a87ee'],
						threshold: {
							//unit: 'value', // percentage is default
							//max: 200, // 100 is default
							values: [30, 60, 90, 100]
						}
					}
				}
			});

			$scope.$timeoutId = $timeout(function(){
				updateChart(40);
			}, 300)
			$scope.$timeoutId = $timeout(function(){
				updateChart(100);
			}, 850)
		}
	}

	/**
	 * When loading the timer view, ensure we've created our chart element.
	 */
	createChart();

	/**
	 * clear Angular Timer, Utility Function
	 */
	var clearTimer = function() {
		$scope.$broadcast('timer-clear');
	};

	/**
	 * Update Break Chart
	 *
	 * For now breaks are simply divs with a width. This will
	 * update the chart (div) in the dom by callback.
	 *
	 * May become an actual chart later.
	 *
	 * TODO: This is gross, for the love of god clean it up.
	 */
	var updateBreakChart = function() {
		if ( $scope.break_timer_set ) {
			var el = document.getElementById('break-progress'),
				px = $scope.timer.break_percentage+"%";
			el.style.width = px;
		}
	}

	/**
	 * Begin Break
	 *
	 * Sets the timer state to break_timer,
	 * and triggers timer-next.
	 */
	$scope.beginBreak = function() {
		clearTimer();
		$scope.timer.state = 'break_timer';
		$scope.$broadcast('timer-next');
	}

	/**
	 * Finishes a Break.
	 *
	 * Sets the percent to 0,
	 * updates the visual chart,
	 * and marks the state as complete.
	 */
	var finishBreak = function() {
		$scope.timer.break_percentage = 0;
		updateBreakChart();

		$scope.timer.state = "complete";
		$scope.$broadcast('timer-next');
	}


	/**
	 * Begin Timer
	 *
	 * Sets the timer state to timer,
	 * and triggers timer-next.
	 */
	$scope.beginTimer = function() {
		$scope.timer.state = 'timer';
		$scope.$broadcast('timer-next');
	}

	/**
	 * Finishes a Break.
	 *
	 * Sets the percent to 0,
	 * updates the visual chart,
	 * and marks the state as complete.
	 */
	var finishTimer = function() {
		$scope.timer.percent = 100;
		$scope.timer_running = false;
		$scope.timer.remaining = 0;
		updateChart();

		$scope.timer.state = "timer_finished";

		$scope.$broadcast('timer-next');
	}

	/**
	 * Edit timer
	 *
	 * Opens the current scopes timer in a modal for editing.
	 */
	$scope.editTimer = function() {
		$scope.timer.state = 'editing';
		$scope.openModal($scope.timer.slug);
	}

	/**
	 * Starts the Break Timer.
	 *
	 * This will create the values needed to trigger the angular-timer,
	 * and start it.
	 *
	 * Running this will also unset all the values on regular timer.
	 */
	$scope.startBreakTimer = function() {

		_apply($scope.timer_set = false);

		$scope.break_timer_started = new Date();

		/**
		 * If the timer was paused, and there is timer.remaining
		 * available.
		 *
		 * Start a new timer, and replace timer.length with
		 * timer.remaining.
		 */
		if ( $scope.timer.break_remaining > 0 ) {
			$scope.break_timer_should_end = addMilliseconds($scope.break_timer_started, $scope.timer.break_remaining);
		} else {
			$scope.break_timer_should_end = addMinutes($scope.break_timer_started, $scope.timer.break.value);
		}

		/**
		 * Takes our start, and end time values and turns them into a unix
		 * timestamp.
		 *
		 * This is used in the timer template in order to declare start, and
		 * end time values for the angular-timer directive.
		 */
		$scope.break_timer_start_time = $scope.break_timer_started.getTime();
		$scope.break_timer_end_time = $scope.break_timer_should_end.getTime();

		$scope.break_timer_set = true;

		/**
		 * Our break timer doesn't seem to autostart, thanks to already
		 * broadcasting to angular-timer to stop our timer.
		 *
		 * Going to broadcast to start again
		 */
		$scope.$broadcast('timer-start');

	}

	/**
	 * Start Timer
	 *
	 * Sets up the timer attributes, and then runs start timer
	 */
	$scope.startTimer = function() {
		$scope.timer_started = new Date();

		/**
		 * If the timer was paused, and there is timer.remaining
		 * available.
		 *
		 * Start a new timer, and replace timer.length with
		 * timer.remaining.
		 */
		if ( $scope.timer.remaining > 0 ) {
			$scope.timer_should_end = addMilliseconds($scope.timer_started, $scope.timer.remaining);
		} else {
			$scope.timer_should_end = addMinutes($scope.timer_started, $scope.timer.length.value);
		}

		/**
		 * Takes our start, and end time values and turns them into a unix
		 * timestamp.
		 *
		 * This is used in the timer template in order to declare start, and
		 * end time values for the angular-timer directive.
		 */
		$scope.timer_start_time = $scope.timer_started.getTime();
		$scope.timer_end_time = $scope.timer_should_end.getTime();

		$scope.timer_set = true;

		$scope.$broadcast('timer-start');
		$scope.timer_running = true;
	};

	/**
	 * Pause timer
	 *
	 * Marks the current timestamp as reference for when the timer stopped last,
	 * and calculates remaining ms on timer for use when resuming timer.
	 *
	 * Stops the angular-timer
	 */
	$scope.pauseTimer = function() {
		stopTimer();
		$scope.timer.state = "paused";
	};

	/**
	 * Resumes a timer after pausing.
	 *
	 * Assuming for now that this doesn't get used for Break.
	 */
	$scope.resumeTimer = function() {
		$scope.timer.state = "timer";
		$scope.$broadcast('timer-next');
	}

	/**
	 * Resets timer difference
	 *
	 * When timer.remaining is set to 0, the next loop of beginTimer
	 * will start with the original timer value again.
	 *
	 * Resets and updates timer_chart to 0
	 *
	 */
	$scope.resetTimer = function() {
		clearTimer();
		updateChart();
		$scope.restoreDefaults();

		/**
		 * After restoring defaults, we still have a chart even though we
		 * just set the flag to false. fix it here.
		 */
		$scope.chart_set = true;

		/**
		 * for some reason after finishing, it doesn't update the
		 * break_timer_set watch?
		 */
		_apply($scope.break_timer_set = false);
	};

	/**
	 * A 'tick' event from the angular-timer, however this seems to wait
	 * until the timer stops to finish updating events.
	 *
	 * Doesn't play nice with our intentions.
	 */
	$scope.$on('timer-tick', function (event, data){
		$scope.$broadcast('timer-percent', data.millis);
	});

	/**
	 * Wheneve anything stops the angular-timer (finishes, pauses, resets) this
	 * event is triggered.
	 *
	 * We can determine if this is the completed event, by checking if there are
	 * any remaining ms.
	 */
	$scope.$on('timer-stopped', function (event, data){
		$scope.timer_running = false;

		/**
		 * If the timer stops, and there are no millis left, our timer
		 * has finished itself. Its time to state that our timer fiinished.
		 */
		if (data.millis <= 0) {
			$scope.$broadcast('timer-complete');
		}

		if ($scope.debug) {
			console.log(event);
			console.log('Timer Stopped - data = ', data);
		}
	});

	/**
	 * Timer complete
	 *
	 * This event is triggered by timer-stopped, when there is no ms left.
	 */
	$scope.$on('timer-complete', function(event, data) {

		/**
		 * If our timer is complete, and it is the break timer,
		 * finish the break off.
		 */
		if ( $scope.timer.state === "break_timer" ) {
			finishBreak();
		}

		/**
		 * If our timer is complete, and its our regular timer,
		 * finish it off.
		 */
		if ( $scope.timer.state === "timer" ) {
			finishTimer();
		}

	});

	/**
	 * Timer percent event
	 *
	 * Triggerd by the timer-tick event.
	 *
	 * This will calculate the current percent while the timer ticks, and
	 * update the scopes percentage variable for use in the chart.
	 */
	$scope.$on('timer-percent', function(event, millis){

		/**
		 * When calculating timer percent, we get the Inverse percentage. This
		 * is to fill the gauge from 0-100 as time goes on.
		 *
		 * When calculating break percent, we get the percentage. This is to
		 * empty the gauge from 100-0 as time goes on.
		 */
		if ( $scope.timer.state === "break_timer" ) {
			$rootScope.timer.break_percentage = getPercentage(millis, $scope.timer.break.ms);
		} else {
			$rootScope.timer.percent = getInversePercentage(millis, $scope.timer.length.ms);
		}

		updateBreakChart();
		updateChart();

		if($scope.debug && $scope.debug_log_percent) {
			console.log($rootScope.timer.percent);
		}

	});

	/**
	 * Master event function for controlling the timer event timeline.
	 *
	 * The timer will have a state attribute, we will switch and run events
	 * based on the timer state.
	 *
	 * This will be called with timer-next.
	 */
	$scope.$on('timer-next', function(event) {
		if ( $scope.debug ) {
			console.log("State: " + $scope.timer.state);
		}

		//updateChartClass();

		/**
		 * Switch based on case, and trigger the correct event.
		 */
		switch ( $scope.timer.state ) {

			/**
			 * Timer is ready to be run.
			 *
			 * run the startTimer function.
			 */
			case "timer":
				$scope.startTimer();
				break;

			/**
			 * Break Timer is ready to be run.
			 *
			 * runs the startBreakTimer function.
			 */
			case "break_timer" :
				$scope.startBreakTimer();
				break;

			/**
			 * Timer finished, and completed. Ready to run the break timer.
			 */
			case "timer_finished" :
				$scope.beginBreak();
				break;

			/**
			 * when our break timer finishes entirely, our entire process is
			 * complete.
			 *
			 * Should increment timer.total
			 *
			 * should trigger repeat if available
			 */
			case "complete" :
				$scope.resetTimer();

				// HERE WE ARE,
			// Need to check if the timer has a repeat value set to true.
			// bind that value to the toggle in the view.
			// If its true, run an event called repeatTimer(),
			// otherwise, just run resetTimer()
			 //debugger

				if ($scope.debug) {
					console.log("@@@@@@@@@@@@@@@@@@@@");
					console.log("@@@TIMER COMPLETE@@@");
					console.log("@@@@@@@@@@@@@@@@@@@@");
				}
				break;

			/**
			 * When everything is complete, the timer is set back to off.
			 * Ensure that everythign is back to default.
			 */
			case "off" :
				$scope.restoreDefaults();
				break;

			/**
			 * Should do nothing, really
			 */
			default :
				if ( $scope.debug ) {
					console.log("triggered default next event.");
				}

		}
	});

})

.controller('AccountCtrl', function($scope) {
});
