import Polling from "../../src/Api/Polling";

describe("Polling Test", () => {
	it("Does polling", () => {
		let lastPollDate;
		const apiMock = {
			getMessages: () => {
				const date = new Date();
				const dateAsTime = new Intl.DateTimeFormat("nl-NL", {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				}).format(date);
				console.log(`[${dateAsTime}] Received a poll!`);

				if(lastPollDate) {
					console.log(date - lastPollDate);
				}

				lastPollDate = date;
			},
		};
		const accountIdentification = "0W4qcE5aXoKq9OzvHxj2";
		const deviceIdentification = "aaaaaaaaaaaaaaaa";

		Polling.startPolling(apiMock, accountIdentification, deviceIdentification);

		// TODO: Actually test for something

		// expect(true).to.equal(false);
	});
});
