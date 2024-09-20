import ow from "ow";
import ApiEventTarget from "./ApiEventTarget";
import {messages, messageSent, subscribe} from "./Constants/Events";
import Logger from "js-logger";

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
		ow(customIntervals, "customIntervals", ow.optional.array.nonEmpty);
		ow(customIntervals, "customIntervals", ow.optional.array.ofType(ow.string));

		this.resetIntervalTrackers();

		this.api = api;
		this.currentIntervals = customIntervals || defaultIntervals;

		this.isRunning = false;
		this.eventListenersInitialized = false;
		this.eventListenersAbortController = undefined;
		this.lastMessageIdReceived = undefined;
	}

	/**
	 * Initializes values which track the current interval
	 * and the handle of the interval
	 */
	resetIntervalTrackers() {
		this.currentIntervalStep = 0;
		this.currentIntervalAmount = 0;
		this.timeoutID = null;
	}

	/**
	 * Initializes the event listeners for Api events
	 * Only does this once to prevent duplicate listeners
	 */
	initializeEventListeners() {
		if(this.eventListenersInitialized)
			return;

		this.eventListenersAbortController = new AbortController();

		ApiEventTarget.addEventListener(
			messageSent,
			this.handleMessageSent,
			{signal: this.eventListenersAbortController.signal},
		);
		ApiEventTarget.addEventListener(
			subscribe,
			this.handleSubscribe,
			{signal: this.eventListenersAbortController.signal},
		);
		ApiEventTarget.addEventListener(
			messages,
			this.handleNewMessages,
			{signal: this.eventListenersAbortController.signal},
		);

		this.eventListenersInitialized = true;
	}

	/**
	 * Removes the event listeners from the event target
	 */
	clearEventListeners() {
		if(!this.eventListenersInitialized)
			return;

		this.eventListenersAbortController.abort(); // This removes all event listeners connected to this abort controller

		this.eventListenersInitialized = false;
	}

	handleMessageSent = () => {
		this.restartPolling();
	};

	handleSubscribe = (event) => {
		// We don't want to start polling for messages when the subscribe-call returned errors
		if(event.detail.errorNotifications)
			return;


		this.startPolling();
	};

	/**
	 *
	 * @param event {{detail: {data: []}}}
	 */
	handleNewMessages = (event) => {
		const messageIds = event.detail.data.map(message => message.id);

		if(messageIds.length > 0)
			messageIds.sort((a, b) => b - a);

		this.lastMessageIdReceived = messageIds[0];
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
		const {
			groups: {
				timeValue,
				timeUnit,
			},
		} = regex.exec(intervalAsString);

		return timeValue * intervalTimeUnits[timeUnit];
	}

	async pollInterval() {
		if(!this.api.deviceRegistered) {
			Logger.warn("Polling interval canceled because device is not yet registered!");
			return;
		}

		// Get messages
		await this.api.getMessages(this.lastMessageIdReceived);

		// Increase poll counter for this interval
		this.currentIntervalAmount++;

		// Stop interval when counter reaches max
		if(this.currentIntervalAmount === maxIntervalAmount) {
			// Reset the tracker for how many intervals we had for the current step
			this.currentIntervalAmount = 0;

			// Only update to the next interval step if there is one
			if(this.currentIntervalStep < this.currentIntervals.length - 1)
				this.currentIntervalStep++;


			// Else; just keep this interval running indefinitely
		}

		if(this.timeoutID)
			clearTimeout(this.timeoutID);

		if(this.isRunning) {
			this.timeoutID = setTimeout(
				this.pollInterval.bind(this),
				PollingService.intervalToValue(this.currentIntervals[this.currentIntervalStep]),
			);
		}
	}

	/**
	 * Setup event listeners (for resetting the polling
	 * on specific API events) and start with polling.
	 */
	startPolling() {
		this.isRunning = true;

		// Setup event listeners for events that may be sent
		// by the Api
		this.initializeEventListeners();

		this.pollInterval(); // Start the first interval
	}

	/**
	 * Stops the polling interval
	 */
	stopPolling() {
		this.isRunning = false;
		clearTimeout(this.timeoutID);
		this.resetIntervalTrackers();
		this.clearEventListeners();
	}

	/**
	 * Stops polling and restarts it
	 */
	restartPolling() {
		this.stopPolling();
		this.startPolling();
	}

	/**
	 * Returns the amount of times we run a single interval
	 * @return {number}
	 */
	static getMaxIntervalAmount() {
		return maxIntervalAmount;
	}
}
