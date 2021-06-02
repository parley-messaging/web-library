import PollingService from "../../src/Api/Polling";

const config = {
	accountIdentification: "0W4qcE5aXoKq9OzvHxj2",
	deviceIdentification: "aaaaaaaaaaaaaaaa",
	customIntervals: [
		"500ms", "1s",
	],
	maxIntervalAmount: PollingService.getMaxIntervalAmount(),
};

describe("PollingService Test", () => {
	it("polls with increasing intervals", () => {
		let lastPollDate = new Date();
		const pollTimings = [];
		const maxPollTimingsLength = config.customIntervals.length * config.maxIntervalAmount;

		// Checking timing performance is impossible to do exactly on the millisecond
		// so that's why we need some room in which the timing can deviate
		// ex; Current timing = 1010ms, Expected timing = 1000ms, Test result = success
		const deviationAmount = 300;

		const collectPollTimings = new Promise((resolve) => {
			// This mock pretends to be the API so we can track when we get a getMessages call
			const apiMock = {
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
				config.accountIdentification,
				config.deviceIdentification,
				config.customIntervals,
			);

			// Start the polling mechanism
			pollingService.startPolling();
		});

		cy.wrap(collectPollTimings, {timeout: 100000})
			.then((collectedPollTimings) => {
				expect(collectedPollTimings.length)
					.equal(maxPollTimingsLength);

				collectedPollTimings.forEach((actualPollTiming, index) => {
					// Because the interval array is "[interval0, interval4]" (each interval is done 5 times)
					// and the poll timing array is  "[timing0, timing1, timing2, ...]
					// we need to calculate the index so it matches up with the interval array
					const customIntervalIndex = Math.floor(index / config.maxIntervalAmount);

					// Convert interval "1s" to value "1000" (ms)
					// eslint-disable-next-line max-len
					const expectedPollTiming = PollingService.intervalToValue(config.customIntervals[customIntervalIndex]);

					// Check if the timing is ~= the expected timing
					// (checking timing exact is impossible to reliably test..)
					expect(actualPollTiming).to.be.within(
						expectedPollTiming - deviationAmount,
						expectedPollTiming + deviationAmount,
					);
				});
			});
	});

	it("stops polling when told", () => {
		let calls = 0;
		const customIntervals = ["10ms"];
		const maxPollTimingsLength = customIntervals.length * config.maxIntervalAmount;

		const promise = new Promise((resolve) => {
			const apiMock = {
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
				config.accountIdentification,
				config.deviceIdentification,
				config.customIntervals,
			);

			// Start the polling mechanism
			pollingService.startPolling(
				apiMock,
				config.accountIdentification,
				config.deviceIdentification,
				customIntervals,
			);
		});

		cy.wrap(promise)
			.then(async () => {
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

	// TODO: Test restartPolling
});
