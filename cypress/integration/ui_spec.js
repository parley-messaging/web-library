import {InterfaceTexts} from "../../src/UI/Scripts/Context";
import {version} from "../../package.json";

function visitHome() {
	cy.visit("/", {
		onLoad: (window) => {
			window.initParleyMessenger();
		},
	});

	cy.get("[id=app]").as("app");
}

function clickOnLauncher() {
	return cy.get("@app")
		.find("[class^=launcher__]")
		.find("button")
		.should("be.visible")
		.click();
}

function sendMessage(testMessage) {
	return cy.get("@app")
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
	return cy.get("@app")
		.find("[class^=wrapper__]")
		.should("be.visible")
		.find("[class^=body__]")
		.should("be.visible")
		.contains(testMessage)
		.should("be.visible");
}

describe("UI", () => {
	describe("sending messages", () => {
		it("should send a new message with the new message showing up in the conversation", () => {
			const testMessage = `Test message ${Date.now()}`;

			visitHome();
			clickOnLauncher();
			sendMessage(testMessage);
			findMessage(testMessage);
		});

		it("should show a generic error when the API returns `status = ERROR`, but without an error", () => {
			const testMessage = `Test message ${Date.now()}`;

			cy.intercept("POST", "*/**/messages", {
				statusCode: 400,
				body: {status: "ERROR"},
			});

			visitHome();
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

			visitHome();
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

			visitHome();
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

		it("should show the `subscribeDeviceFailedError` error when subscribing fails", () => {
			cy.intercept("POST", "*/**/devices", {
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

			visitHome();
			clickOnLauncher();

			// Validate that api error is visible
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=error__]")
				.should("be.visible")
				.should("have.text", "Something went wrong while registering your device, please re-open the chat to try again");
		});

		it("should show the `retrievingMessagesFailedError` error when retrieving messages fails", () => {
			cy.intercept("GET", "*/**/messages", {
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

			visitHome();
			clickOnLauncher();

			// Validate that api error is visible
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=error__]")
				.should("be.visible")
				.should("have.text", "Something went wrong while retrieving your messages, please re-open the chat if this keeps happening");
		});

		it("should hide the error when clicking the close error button", () => {
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

			visitHome();
			clickOnLauncher();
			sendMessage(testMessage);

			// Validate that api error is visible
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=error__]")
				.should("be.visible")
				.should("have.text", "Something went wrong while sending your message, please try again later");

			cy.intercept("POST", "*/**/messages"); // Remove handler

			// Click the error close button
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=error__]")
				.should("be.visible")
				.find("[class^=closeButton__]")
				.should("be.visible")
				.click();

			// Validate that the error disappeared
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=error__]")
				.should("not.exist");
		});
	});

	describe("parley config settings", () => {
		describe("runOptions", () => {
			describe("interfaceTexts", () => {
				describe("desc", () => {
					it("should change the title text", () => {
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
				describe("infoText", () => {
					it("should change the welcome message", () => {
						const parleyConfig = {runOptions: {interfaceTexts: {infoText: "This is the info text"}}};

						// To test this we need to ignore the API's `welcomeMessage`
						cy.fixture("getMessagesResponse.json").then((json) => {
							const _json = {
								...json,
								welcomeMessage: null,
							};
							cy.intercept("GET", "*/**/messages", _json);
						});

						cy.visit("/", {
							onBeforeLoad: (win) => {
								// eslint-disable-next-line no-param-reassign
								win.parleySettings = parleyConfig;
							},
						});

						cy.get("[id=app]").as("app");

						clickOnLauncher();

						cy.get("@app")
							.find("[class*=announcement__]")
							.first()
							.should("have.text", parleyConfig.runOptions.interfaceTexts.infoText);

						// Test if it changes during runtime
						const newInfoText = "This is the info text #2";
						cy.window().then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.infoText = newInfoText;
						});

						cy.get("@app")
							.find("[class*=announcement__]")
							.first()
							.should("have.text", newInfoText);
					});
					it("should get overridden by API's welcomeMessage", () => {
						const parleyConfig = {runOptions: {interfaceTexts: {infoText: "This is the info text"}}};
						const welcomeMessage = "This is the API's welcome message";

						// To test this we need to change the API's `welcomeMessage`
						cy.fixture("getMessagesResponse.json").then((json) => {
							const _json = {
								...json,
								welcomeMessage,
							};
							cy.intercept("GET", "*/**/messages", _json);
						});

						cy.visit("/", {
							onBeforeLoad: (win) => {
								// eslint-disable-next-line no-param-reassign
								win.parleySettings = parleyConfig;
							},
						});

						cy.get("[id=app]").as("app");

						clickOnLauncher();

						cy.get("@app")
							.find("[class*=announcement__]")
							.first()
							.should("have.text", welcomeMessage);
					});
					it("should only show welcomeMessage after GET /messages call", () => {
						// Cancel outgoing GET /messages (this works better than a long delay)
						// This wat we can see what happens while the request is busy
						cy.intercept("GET", "*/**/messages", (req) => {
							// never call req.continue();
						});

						cy.visit("/");

						cy.get("[id=app]").as("app");

						clickOnLauncher();

						// We should not see any announcements while the request is "busy"
						cy.get("@app")
							.find("[class*=announcement__]")
							.should("not.exist");
					});
				});
				describe("placeholderMessenger", () => {
					it("should change the input's placeholder text", () => {
						const parleyConfig = {runOptions: {interfaceTexts: {placeholderMessenger: "This is the placeholder"}}};

						cy.visit("/", {
							onBeforeLoad: (win) => {
								// eslint-disable-next-line no-param-reassign
								win.parleySettings = parleyConfig;
							},
						});

						cy.get("[id=app]").as("app");

						clickOnLauncher();

						cy.get("@app")
							.find("[class^=text__]")
							.find("textarea")
							.should("have.attr", "placeholder", parleyConfig.runOptions.interfaceTexts.placeholderMessenger);

						// Test if it changes during runtime
						const newPlaceholder = "This is the placeholder #2";
						cy.window().then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.placeholderMessenger = newPlaceholder;
						});

						cy.get("@app")
							.find("[class^=text__]")
							.find("textarea")
							.should("have.attr", "placeholder", newPlaceholder);
					});
				});
			});
			describe("country", () => {
				it("should change the language of interface texts", () => {
					const parleyConfig = {
						runOptions: {
							country: "en",
							interfaceTexts: {desc: "Messenger - EN"},
						},
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
						.should("have.attr", "placeholder", InterfaceTexts.english.inputPlaceholder);

					// Test if it changes during runtime
					cy.window().then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.runOptions.country = "nl";
					});

					cy.get("@app")
						.find("[class^=text__]")
						.find("textarea")
						.should("have.attr", "placeholder", InterfaceTexts.dutch.inputPlaceholder);

					// Extra test to validate that custom interface texts (desc we set above)
					// have not been overwritten by the new language's defaults
					cy.get("@app")
						.find("[class^=title__]")
						.should("have.text", parleyConfig.runOptions.interfaceTexts.desc);
				});
			});
		});
		describe("roomNumber", () => {
			it("should register a new device when switching accounts", () => {
				const parleyConfig = {roomNumber: "0W4qcE5aXoKq9OzvHxj2"};
				const testMessage = `test message before switching room numbers ${Date.now()}`;

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
				cy.intercept("POST", "*/**/devices", (req) => {
					expect(req.headers)
						.to.have.deep.property("x-iris-identification");
					expect(req.headers["x-iris-identification"])
						.to.match(new RegExp(`^${newAccountIdentification}:`, "u"));
				}).as("createDevice");

				cy.window().then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.roomNumber = newAccountIdentification;
				});

				cy.wait("@createDevice");
			});
		});
		describe("xIrisIdentification", () => {
			it("should register a new device when switching identifications", () => {
				const parleyConfig = {xIrisIdentification: "aaaaaaaaaaaa"};
				const testMessage = `test message before switching udid ${Date.now()}`;

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
				const newUdid = "bbbbbbbbbbbb";
				cy.intercept("POST", "*/**/devices", (req) => {
					expect(req.headers)
						.to.have.deep.property("x-iris-identification");
					expect(req.headers["x-iris-identification"])
						.to.match(new RegExp(`^.*:${newUdid}`, "u"));
				}).as("createDevice");

				cy.window().then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.xIrisIdentification = newUdid;
				});

				cy.wait("@createDevice");
			});
		});
		describe("authHeader", () => {
			it("should re-register the device when it changes", () => {
				const parleyConfig = {roomNumber: "0W4qcE5aXoKq9OzvHxj2"};
				const testMessage = `test message before switching auth header ${Date.now()}`;

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
				const newAuthHeader = "1234";
				cy.intercept("POST", "*/**/devices", (req) => {
					expect(req.headers)
						.to.have.deep.property("authorization", newAuthHeader);
				}).as("createDevice");

				cy.window().then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.authHeader = newAuthHeader;
				});

				cy.wait("@createDevice");
			});
		});
		describe("userAdditionalInformation", () => {
			it("should re-register the device when it changes", () => {
				const parleyConfig = {
					roomNumber: "0W4qcE5aXoKq9OzvHxj2",
					userAdditionalInformation: {"some-key": "some-value"},
				};
				const testMessage = `test message before switching userAdditionalInformation ${Date.now()}`;

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
				const newUserAdditionalInformation = {
					"some-key": "some-value",
					"some-layer": {"some-key-in-layer": "some-value-in-layer"},
				};

				cy.intercept("POST", "*/**/devices", (req) => {
					expect(JSON.parse(req.body))
						.to.have.deep.property("userAdditionalInformation", newUserAdditionalInformation);
				}).as("createDevice");

				cy.window().then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.userAdditionalInformation["some-layer"] = newUserAdditionalInformation["some-layer"];
				});

				cy.wait("@createDevice");
			});
		});
		describe("weekdays", () => {
			describe("format [day, start, end]", () => {
				it("should show we are offline/online outside/inside working hours", () => {
					const parleyConfig = {
						weekdays: [ // closed every day
							["Monday"],
							["Tuesday"],
							["Wednesday"],
							["Thursday"],
							["Friday"],
							["Saturday"],
							["Sunday"],
						],
						interface: {hideChatAfterBusinessHours: true},
					};

					cy.visit("/", {
						onBeforeLoad: (win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings = parleyConfig;
						},
					});

					cy.get("[id=app]").as("app");

					// Launcher is not rendered because we are offline
					// and outside working hours
					cy.get("@app")
						.get("[class^=launcher__]")
						.should("not.exist");

					// Test if it changes during runtime
					const newWeekdays = [
						[
							"Monday", 8.00, 23.30,
						],
						[
							"Tuesday", 8.00, 23.30,
						],
						[
							"Wednesday", 8.00, 23.30,
						],
						[
							"Thursday", 8.00, 23.30,
						],
						[
							"Friday", 8.00, 23.30,
						],
						[
							"Saturday", 8.00, 23.30,
						],
						[
							"Sunday", 8.00, 23.30,
						],
					];

					cy.window().then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.weekdays = newWeekdays;
					});

					// Launcher should appear again because we
					// are inside working hours
					clickOnLauncher();
				});
			});
			describe("format [day, start, end, bool]", () => {
				it("should show we are offline/online outside/inside working hours", () => {
					const parleyConfig = {
						weekdays: [ // closed every day
							["Monday"],
							["Tuesday"],
							["Wednesday"],
							["Thursday"],
							["Friday"],
							["Saturday"],
							["Sunday"],
						],
						interface: {hideChatAfterBusinessHours: true},
					};

					cy.visit("/", {
						onBeforeLoad: (win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings = parleyConfig;
						},
					});

					cy.get("[id=app]").as("app");

					// Launcher is not rendered because we are offline
					// and outside working hours
					cy.get("@app")
						.get("[class^=launcher__]")
						.should("not.exist");

					// Test if it changes during runtime
					const newWeekdays = [
						[
							"Monday", 8.00, 23.30, true,
						],
						[
							"Tuesday", 8.00, 23.30, true,
						],
						[
							"Wednesday", 8.00, 23.30, true,
						],
						[
							"Thursday", 8.00, 23.30, true,
						],
						[
							"Friday", 8.00, 23.30, true,
						],
						[
							"Saturday", 8.00, 23.30, true,
						],
						[
							"Sunday", 8.00, 23.30, true,
						],
					];

					cy.window().then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.weekdays = newWeekdays;
					});

					// Launcher should appear again because we
					// are inside working hours
					clickOnLauncher();
				});
			});
			describe("format [start timestamp, end timestamp]", () => {
				it("should show we are offline/online outside/inside working hours", () => {
					const parleyConfig = {
						weekdays: [
							[
								946681200, 946684800,
							], // 2000-01-01 00:00:00 -  2000-01-01 01:00:00
						],
						interface: {hideChatAfterBusinessHours: true},
					};

					cy.visit("/", {
						onBeforeLoad: (win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings = parleyConfig;
						},
					});

					cy.get("[id=app]").as("app");

					// Launcher is not rendered because we are offline
					// and outside working hours
					cy.get("@app")
						.get("[class^=launcher__]")
						.should("not.exist");

					// Test if it changes during runtime
					const startDate = new Date();
					startDate.setUTCHours(startDate.getUTCHours() - 1);
					const endDate = new Date();
					endDate.setUTCHours(endDate.getUTCHours() + 1);
					const newWeekdays = [
						[
							startDate.getTime() / 1000, endDate.getTime() / 1000,
						],
					];

					cy.window().then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.weekdays = newWeekdays;
					});

					// Launcher should appear again because we
					// are inside working hours
					clickOnLauncher();
				});
			});
			describe("format [start timestamp, end timestamp, bool]", () => {
				it("should show we are offline/online outside/inside working hours", () => {
					const parleyConfig = {
						weekdays: [
							[
								946681200, 946684800,
							], // 2000-01-01 00:00:00 -  2000-01-01 01:00:00
						],
						interface: {hideChatAfterBusinessHours: true},
					};

					cy.visit("/", {
						onBeforeLoad: (win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings = parleyConfig;
						},
					});

					cy.get("[id=app]").as("app");

					// Launcher is not rendered because we are offline
					// and outside working hours
					cy.get("@app")
						.get("[class^=launcher__]")
						.should("not.exist");

					// Test if it changes during runtime
					const startDate = new Date();
					startDate.setUTCHours(startDate.getUTCHours() - 1);
					const endDate = new Date();
					endDate.setUTCHours(endDate.getUTCHours() + 1);
					const newWeekdays = [
						[
							startDate.getTime() / 1000, endDate.getTime() / 1000, true,
						],
					];

					cy.window().then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.weekdays = newWeekdays;
					});

					// Launcher should appear again because we
					// are inside working hours
					clickOnLauncher();
				});
			});
		});
		describe("version", () => {
			it("should set the library version on startup", () => {
				cy.visit("/");

				cy.get("[id=app]").as("app");

				// Make sure app exists
				cy.get("@app")
					.get("[class^=launcher__]")
					.should("exist");

				cy.window().then((win) => {
					expect(win.parleySettings.version).to.equal(version);
				});
			});
		});
	});
});
