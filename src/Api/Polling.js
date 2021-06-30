const maxIntervalAmount = 5;
const secondInMs = 1000;
const minuteOrHourMultiplier = 60;
const dayMultiplier = 24;
const defaultIntervals = [
	"2s", "5s", "10s", "30s", "1m", "5m", "15m", "30m", "2h", "5h", "6h",
];
const intervalTimeUnits = {
	ms: 1,
	s: secondInMs,
	m: secondInMs * minuteOrHourMultiplier,
	h: secondInMs * minuteOrHourMultiplier * minuteOrHourMultiplier,
	d: secondInMs * minuteOrHourMultiplier * minuteOrHourMultiplier * dayMultiplier,
};

export default class PollingService {
	constructor(api, customIntervals) {
		this.resetIntervalTrackers();
		this.currentIntervals = defaultIntervals;
		this.api = api;

		if(customIntervals !== undefined)
			this.currentIntervals = customIntervals;
	}

	/**
	 * Initializes values which track the current interval
	 * and the handle of the interval
	 */
	resetIntervalTrackers() {
		this.currentIntervalStep = 0;
		this.currentIntervalAmount = 0;
		this.intervalID = null;
	}

	/**
	 * Convert something like `"2m"` to 2 minutes in ms;
	 * `minute = 1000 * 60, 2 minutes = 2 * (1000 * 60)`
	 *
	 * @return {number} The time in milliseconds
	 * @param intervalAsString
	 */
	static intervalToValue(intervalAsString) {
		const regex = /(?<timeValue>\d+)(?<timeUnit>\w+)/u;
		const {groups: {timeValue, timeUnit}} = regex.exec(intervalAsString);

		return timeValue * intervalTimeUnits[timeUnit];
	}

	/**
	 * Start polling
	 */
	startPolling() {
		this.intervalID = window.setInterval(() => {
			// Get messages
			this.api.getMessages();

			// Increase poll counter for this interval
			this.currentIntervalAmount++;

			// Stop interval when counter reaches max
			if(this.currentIntervalAmount === maxIntervalAmount) {
				// Reset the tracker for how many intervals we had for the current step
				this.currentIntervalAmount = 0;

				// Only update to the next interval step if there is one
				if(this.currentIntervalStep < this.currentIntervals.length) {
					this.currentIntervalStep++;

					// Stop/Remove the interval from the window
					window.clearInterval(this.intervalID);

					// Re-start polling
					this.startPolling();
				}

				// Else; just keep this interval running indefinitely
			}
		}, PollingService.intervalToValue(this.currentIntervals[this.currentIntervalStep]));
	}

	/**
	 * Stops the polling interval
	 */
	stopPolling() {
		window.clearInterval(this.intervalID);
		this.resetIntervalTrackers();
	}

	/**
	 * Stops polling and restarts it
	 */
	restartPolling() {
		this.stopPolling();
		this.startPolling();
	}

	/**
	 * Returns the amount of times we run a singel interval
	 * @return {number}
	 */
	static getMaxIntervalAmount() {
		return maxIntervalAmount;
	}
}
