import PollingService from "../../src/Api/Polling";
import ApiEventTarget from "../../src/Api/ApiEventTarget";
import ApiResponseEvent from "../../src/Api/Private/ApiResponseEvent";
import {messageSent, subscribe} from "../../src/Api/Constants/Events";

describe("Polling Service", () => {
	it("should poll with increasing intervals when using startPolling()", () => {
		const customIntervals = [
			"20ms", "200ms",
		];
		const maxIntervalAmount = PollingService.getMaxIntervalAmount();

		let lastPollDate = new Date();
		const pollTimings = [];
		const maxPollTimingsLength = customIntervals.length * maxIntervalAmount;

		// Calculate how long all intervals combined should take
		const totalTimeInMs = customIntervals.reduce((a, b) => {
			return (PollingService.intervalToValue(a) * maxIntervalAmount)
				+ (PollingService.intervalToValue(b) * maxIntervalAmount);
		});
		const timeoutTime = totalTimeInMs + 500; // + a bit of wiggle room

		// Checking timing performance is impossible to do exactly on the millisecond
		// so that's why we need some room in which the timing can deviate
		// ex; Current timing = 1010ms, Expected timing = 1000ms, Test result = success
		// Important; a low value (compared to the interval) can result in flaky tests
		const deviations = [
			"20ms", "50ms",
		];

		const collectPollTimings = new Cypress.Promise((resolve) => {
			// This mock pretends to be the API so we can track when we get a getMessages call
			const apiMock = {
				deviceRegistered: true,
				getMessages: () => {
					const date = new Date();

					// Store the time between last 2 polls
					const pollTiming = date - lastPollDate;
					pollTimings.push(pollTiming);

					// Store the current poll date
					lastPollDate = date;

					// Stop polling if we've reached the end of the intervals
					if(pollTimings.length === maxPollTimingsLength) {
						// eslint-disable-next-line no-use-before-define
						pollingService.stopPolling();
						resolve(pollTimings);
					}
				},
			};

			const pollingService = new PollingService(
				apiMock,
				customIntervals,
			);

			// Start the polling mechanism
			pollingService.startPolling();
		});

		cy.wrap(collectPollTimings, {timeout: timeoutTime})
			.then((collectedPollTimings) => {
				expect(collectedPollTimings.length)
					.equal(maxPollTimingsLength);

				collectedPollTimings.forEach((actualPollTiming, index) => {
					// Because the interval array is "[interval0, interval4]" (each interval is done 5 times)
					// and the poll timing array is  "[timing0, timing1, timing2, ...]
					// we need to calculate the index so it matches up with the interval array
					const customIntervalIndex = Math.floor(index / maxIntervalAmount);

					// Convert interval "1s" to value "1000" (ms)
					// eslint-disable-next-line max-len
					let expectedPollTiming = PollingService.intervalToValue(customIntervals[customIntervalIndex]);

					// When starting polling, the first call is made immediately
					// so it's timing should be instant
					if(index === 0)
						expectedPollTiming = 0;

					// Convert deviation text to value in ms
					const deviationAmount = PollingService.intervalToValue(deviations[customIntervalIndex]);

					// Check if the timing is ~= the expected timing
					// (checking timing exact is impossible to reliably test..)
					expect(actualPollTiming).to.be.within(
						expectedPollTiming - deviationAmount,
						expectedPollTiming + deviationAmount,
					);
				});
			});
	});

	it("should stop polling when using stopPolling()", () => {
		const customIntervals = ["10ms"];
		const maxIntervalAmount = PollingService.getMaxIntervalAmount();

		let calls = 0;
		const maxPollTimingsLength = customIntervals.length * maxIntervalAmount;

		const promise = new Cypress.Promise((resolve) => {
			const apiMock = {
				deviceRegistered: true,
				getMessages: () => {
					calls += 1;

					if(calls === maxPollTimingsLength) {
						// eslint-disable-next-line no-use-before-define
						pollingService.stopPolling();
						resolve();
					}
				},
			};

			const pollingService = new PollingService(
				apiMock,
				customIntervals,
			);

			// Start the polling mechanism
			pollingService.startPolling();
		});

		cy.wrap(promise)
			.then(() => {
				// Wait for some more intervals
				// These intervals should NOT be ran if stopPolling() works as expected
				const waitTime = PollingService.intervalToValue(customIntervals[0]) * 2;
				cy.wait(waitTime)
					.then(() => {
						// Confirm that the calls have not increased further after stopping the polling mechanism
						expect(calls).to.equal(maxPollTimingsLength);
					});
			});
	});

	it("should restart polling using restartPolling()", () => {
		const customIntervals = ["10ms"];
		let pollingService;

		let calls = 0;
		let iterations = 0;
		const maxCallsUntilIteration = PollingService.getMaxIntervalAmount();
		const maxIterations = 2;

		// Calculate how long all intervals combined should take
		const totalTimeInMs = PollingService.intervalToValue(customIntervals[0]) * maxCallsUntilIteration;
		const timeoutTime = totalTimeInMs + 100; // + a bit of wiggle room

		const promise = new Cypress.Promise((resolve) => {
			const apiMock = {
				deviceRegistered: true,
				getMessages: () => {
					calls += 1;

					if(calls === maxCallsUntilIteration) {
						pollingService.stopPolling();
						iterations += 1;

						if(iterations === maxIterations) {
							resolve();
							return;
						}

						calls = 0;
						pollingService.restartPolling();
					}
				},
			};

			pollingService = new PollingService(
				apiMock,
				customIntervals,
			);

			// Start the polling mechanism
			pollingService.startPolling();
		});

		cy.wrap(promise, {timeout: timeoutTime})
			.then(() => {
				const waitTime = PollingService.intervalToValue(customIntervals[0]) * 2;
				cy.wait(waitTime)
					.then(() => {
						// Confirm that there are more than 1 iterations
						expect(iterations).to.equal(maxIterations);
					});
			});
	});

	it("should start polling on subscribe event", () => {
		const customIntervals = ["10ms"];
		let pollingService;

		let gotCall = false;

		const promise = new Cypress.Promise((resolve) => {
			const apiMock = {
				deviceRegistered: true,
				getMessages: () => {
					gotCall = true;
					pollingService.stopPolling();
					resolve();
				},
			};

			// eslint-disable-next-line no-unused-vars
			pollingService = new PollingService(
				apiMock,
				customIntervals,
			);

			// Normally we would call pollingService.startPolling();
			// but that would also start the polling intervals
			// We only want to track the intervals when they are
			// started through the event listener, so we only initialize those
			pollingService.initializeEventListeners();

			// Start the polling mechanism through an Event
			ApiEventTarget.dispatchEvent(new ApiResponseEvent(subscribe, {}));
		});

		cy.wrap(promise, {timeout: 20000})
			.then(() => {
				expect(gotCall).to.equal(true);
			});
	});

	it("should restart polling on messagesent event", () => {
		const customIntervals = ["10ms"];
		let pollingService;
		let gotFirstRestart = false;
		let gotSecondRestart = false;
		let gotThirdRestart = false;

		const promise = new Cypress.Promise((resolve) => {
			const apiMock = {
				deviceRegistered: true,
				getMessages: () => {
					if(gotFirstRestart === false) {
						gotFirstRestart = true;
						pollingService.stopPolling();
						pollingService.initializeEventListeners(); // Re-init event listeners

						// Second re-start of the polling mechanism through an Event
						ApiEventTarget.dispatchEvent(new ApiResponseEvent(messageSent, {}));
					} else if(gotSecondRestart === false) {
						gotSecondRestart = true;
						pollingService.stopPolling();

						// Make sure the event listeners are stopped correctly
						// by triggering an event after calling stopPolling()
						// and later checking if that event caused a third restart
						ApiEventTarget.dispatchEvent(new ApiResponseEvent(messageSent, {}));

						resolve();
					} else {
						gotThirdRestart = true;

						// This should never trigger
						// because polling is never restart at this point
					}
				},
			};

			// eslint-disable-next-line no-unused-vars
			pollingService = new PollingService(
				apiMock,
				customIntervals,
			);
			pollingService.initializeEventListeners();

			// First (re-)start of the polling mechanism through an Event
			ApiEventTarget.dispatchEvent(new ApiResponseEvent(messageSent, {}));
		});

		cy.wrap(promise, {timeout: 20000})
			.then(() => {
				expect(gotFirstRestart).to.equal(true);
				expect(gotSecondRestart).to.equal(true);
				expect(gotThirdRestart).to.equal(false);
			});
	});
});
