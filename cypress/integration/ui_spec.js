import {InterfaceTexts} from "../../src/UI/Scripts/Context";

function clickOnLauncher() {
	cy.get("@app")
		.find("[class^=launcher__]")
		.find("button")
		.should("be.visible")
		.click();
}

function sendMessage(testMessage) {
	cy.get("@app")
		.find("[class^=chat__]")
		.should("be.visible")
		.find("[class^=footer__]")
		.should("be.visible")
		.find("[class^=text__]")
		.should("be.visible")
		.find("textarea")
		.should("have.focus")
		.type(`${testMessage}{enter}`);
}

function findMessage(testMessage) {
	cy.get("@app")
		.find("[class^=wrapper__]")
		.should("be.visible")
		.find("[class^=body__]")
		.should("be.visible")
		.contains(testMessage)
		.should("be.visible");
}

function findChatError(error) {
	cy.get("@app")
		.find("[class^=error__]")
		.should("have.text", error);
}

describe("UI", () => {
	describe("sending messages", () => {
		beforeEach(() => {
			cy.visit("/", {
				onLoad: (window) => {
					window.initParleyMessenger();
				},
			});

			cy.get("[id=app]").as("app");
		});

		it("should send a new message with the new message showing up in the conversation", () => {
			const testMessage = `Test message ${Date.now()}`;

			clickOnLauncher();
			sendMessage(testMessage);
			findMessage(testMessage);
		});

		it("should show a generic error when the API returns `status = \"ERROR\"`, but without an error", () => {
			const testMessage = `Test message ${Date.now()}`;

			cy.intercept("POST", "*/**/messages", {
				statusCode: 400,
				body: {status: "ERROR"},
			});

			clickOnLauncher();
			sendMessage(testMessage);

			// Validate that api error is visible
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=error__]")
				.should("be.visible")
				.should("have.text", "The API request failed but the API did not return an error notification");
		});

		it("should show the `serviceUnreachableNotification` error when the fetch request fails", () => {
			const testMessage = `Test message ${Date.now()}`;

			cy.intercept("POST", "*/**/messages", {forceNetworkError: true});

			clickOnLauncher();
			sendMessage(testMessage);

			// Validate that api error is visible
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=error__]")
				.should("be.visible")
				.should("have.text", "The service is unreachable at the moment, please try again later");
		});

		it("should show the `messageSendFailed` error when sending a message fails", () => {
			const testMessage = `Test message ${Date.now()}`;

			cy.intercept("POST", "*/**/messages", {
				statusCode: 400,
				body: {
					status: "ERROR",
					notifications: [
						{
							type: "error",
							message: "Some specific error",
						},
					],
				},
			});

			clickOnLauncher();
			sendMessage(testMessage);

			// Validate that api error is visible
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=error__]")
				.should("be.visible")
				.should("have.text", "Something went wrong while sending your message, please try again later");
		});
	});

	describe("parley config settings", () => {
		describe("country setting", () => {
			it("should change the language of interface texts", () => {
				const parleyConfig = {
					country: "en",
					runOptions: {interfaceTexts: {desc: "Messenger - EN"}},
				};

				cy.visit("/", {
					onBeforeLoad: (window) => {
						// eslint-disable-next-line no-param-reassign
						window.parleySettings = parleyConfig;
					},
				});

				cy.get("[id=app]").as("app");

				clickOnLauncher();

				cy.get("@app")
					.find("[class^=text__]")
					.find("textarea")
					.should("have.attr", "placeholder", InterfaceTexts.english.placeholderMessenger);

				// Test if it changes during runtime
				cy.window().then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.country = "nl";
				});

				cy.get("@app")
					.find("[class^=text__]")
					.find("textarea")
					.should("have.attr", "placeholder", InterfaceTexts.dutch.placeholderMessenger);

				// Extra test to validate that custom interface texts (desc we set above)
				// have not been overwritten by the new language's defaults
				cy.get("@app")
					.find("[class^=title__]")
					.should("have.text", parleyConfig.runOptions.interfaceTexts.desc);
			});
		});
		describe("runOptions", () => {
			describe("interfaceTexts setting", () => {
				it("should change the interface text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {desc: "This is the title bar"}}};

					cy.visit("/", {
						onBeforeLoad: (win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings = parleyConfig;
						},
					});

					cy.get("[id=app]").as("app");

					clickOnLauncher();

					cy.get("@app")
						.find("[class^=title__]")
						.should("have.text", parleyConfig.runOptions.interfaceTexts.desc);

					// Test if it changes during runtime
					const newTitle = "This is the title bar #2";
					cy.window().then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.runOptions.interfaceTexts.desc = newTitle;
					});

					cy.get("@app")
						.find("[class^=title__]")
						.should("have.text", newTitle);
				});
			});
		});
		describe("roomNumber", () => {
			it.only("should register a new device when switching accounts", () => {
				const parleyConfig = {roomNumber: "0W4qcE5aXoKq9OzvHxj2"};
				const testMessage = "test message before switching room numbers";

				cy.visit("/", {
					onBeforeLoad: (win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings = parleyConfig;
					},
				});

				cy.get("[id=app]").as("app");

				clickOnLauncher();
				sendMessage(testMessage);
				findMessage(testMessage); // Wait until the server received the new message

				// Test if it changes during runtime
				const newAccountIdentification = "1234";
				cy.window().then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.roomNumber = newAccountIdentification;
				});

				clickOnLauncher();
				findChatError("api_key_not_valid");

				// There isn't any good way to check if the new device is registered
				// All we can do is check if the api returns the error due to
				// the new (invalid) account identification
			});
		});
	});
});
