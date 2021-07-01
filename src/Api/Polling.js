import ow from "ow";

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
		ow(api, "api", ow.object.partialShape({getMessages: ow.function}));
		ow(customIntervals, "customIntervals", ow.array.nonEmpty);
		ow(customIntervals, "customIntervals", ow.array.ofType(ow.string));

		this.resetIntervalTrackers();

		this.api = api;
		this.currentIntervals = customIntervals || defaultIntervals;

		this.isRunning = false;
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
		ow(intervalAsString, "intervalAsString", ow.string.nonEmpty);

		const regex = /(?<timeValue>\d+)(?<timeUnit>\w+)/u;
		const {groups: {timeValue, timeUnit}} = regex.exec(intervalAsString);

		return timeValue * intervalTimeUnits[timeUnit];
	}

	/**
	 * Start polling
	 */
	startPolling() {
		this.isRunning = true;

		// Get messages
		this.api.getMessages();

		// Increase poll counter for this interval
		this.currentIntervalAmount++;

		// console.log(`interval amount ${this.currentIntervalAmount}/${maxIntervalAmount}`);
		// console.log(`interval step ${this.currentIntervalStep}/${this.currentIntervals.length - 1}`);

		// Stop interval when counter reaches max
		if(this.currentIntervalAmount === maxIntervalAmount) {
			// Reset the tracker for how many intervals we had for the current step
			this.currentIntervalAmount = 0;

			// Only update to the next interval step if there is one
			if(this.currentIntervalStep < this.currentIntervals.length - 1)
				this.currentIntervalStep++;

			// Else; just keep this interval running indefinitely
		}

		if(this.intervalID)
			clearTimeout(this.intervalID);
		this.intervalID = setTimeout(
			(_this) => {
				if(_this.isRunning)
					_this.startPolling();
			},
			PollingService.intervalToValue(this.currentIntervals[this.currentIntervalStep]),
			this,
		);
	}

	/**
	 * Stops the polling interval
	 */
	stopPolling() {
		this.isRunning = false;
		window.clearTimeout(this.intervalID);
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
