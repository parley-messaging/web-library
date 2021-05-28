// TODO: Poll messages ever X time with increasing delays

const secondInMs = 1000;
const minuteOrHourMultiplier = 60;
const dayMultiplier = 24;
const intervals = [
	"2s", "5s", "10s", "30s", "1m", "5m", "15m", "30m", "2h", "5h", "6h",
];
const intervalTimeValue = {
	s: secondInMs,
	m: secondInMs * minuteOrHourMultiplier,
	h: secondInMs * minuteOrHourMultiplier * minuteOrHourMultiplier,
	d: secondInMs * minuteOrHourMultiplier * minuteOrHourMultiplier * dayMultiplier,
};
let currentIntervalID = 0;
let currentIntervalAmount = 0;
const maxIntervalAmount = 5;
let intervalHandle;

/**
 * Convert something like `"2m"` to 2 minutes in ms;
 * `minute = 1000 * 60, 2 minutes = 2 * (1000 * 60)`
 *
 * @param intervalId
 * @return {number} The time in milliseconds
 */
function intervalToValue(intervalId) {
	const regex = /(?<time>\d+)(?<timeValue>\w)/u;
	const interval = intervals[intervalId];
	const {groups: {time, timeValue}} = regex.exec(interval);
	return time * intervalTimeValue[timeValue];
}

/**
 * Start polling
 * @param api ApiEventTarget
 * @param accountIdentification string
 * @param deviceIdentification string
 */
function startPolling(api, accountIdentification, deviceIdentification) {
	intervalHandle = window.setInterval(() => {
		// Get messages
		api.getMessages(accountIdentification, deviceIdentification);

		// Increase poll counter for this interval
		currentIntervalAmount++;

		// Stop interval when counter reaches max
		if(currentIntervalAmount === maxIntervalAmount) {
			// Stop/Remove the interval from the window
			window.clearInterval(intervalHandle);

			// Only update to the next interval if there is one
			if(currentIntervalID < intervals.length) {
				currentIntervalID++;
			}

			// Re-start polling
			startPolling(api, accountIdentification, deviceIdentification);
		}
	}, intervalToValue(currentIntervalID));
}

// TODO: Function to stop polling
// TODO: Function to reset polling

export default {startPolling};
