import {InterfaceTexts} from "../../src/UI/Scripts/Context";
import {version} from "../../package.json";

const defaultParleyConfig = {roomNumber: "0cce5bfcdbf07978b269"};
function visitHome(parleyConfig) {
	cy.visit("/", {
		onBeforeLoad: (window) => {
			// eslint-disable-next-line no-param-reassign
			window.parleySettings = {
				...defaultParleyConfig, // Always set default config
				...parleyConfig,
			};
		},
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

beforeEach(() => {
	console.log("");
	console.log(`=== BEGIN ${Cypress.currentTest.title} ===`);
	console.log("");

	// This should not go in afterEach,
	// see https://docs.cypress.io/guides/references/best-practices#Using-after-or-afterEach-hooks
	cy.window()
		.then((window) => {
			if(window.destroyParleyMessenger)
				window.destroyParleyMessenger();
		})
		.then(() => {
			return cy.clearLocalStorage();
		});
});

afterEach(() => {
	console.log("");
	console.log(`=== END ${Cypress.currentTest.title} ===`);
	console.log("");
});

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

						visitHome(parleyConfig);

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

						visitHome(parleyConfig);

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

						visitHome(parleyConfig);

						cy.get("[id=app]").as("app");

						clickOnLauncher();

						cy.get("@app")
							.find("[class*=announcement__]")
							.first()
							.should("have.text", welcomeMessage);
					});
					it("should only show welcomeMessage after GET /messages call", () => {
						// Force a long delay on the response to pretend we are "loading"
						// This delay should have no impact on the test duration, because
						// the test will end after we've done our assertion which doesn't
						// have to wait on the response. It's just there to assert the
						// "loading" state
						cy.fixture("getMessagesResponse.json").then((json) => {
							cy.intercept("GET", "*/**/messages", (req) => {
								req.reply({
									statusCode: 200,
									body: {...json},
									delay: 5000,
								});
							});
						});

						visitHome();

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

						visitHome(parleyConfig);

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

					visitHome(parleyConfig);

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
				const testMessage = `test message before switching room numbers ${Date.now()}`;

				visitHome();

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

				visitHome(parleyConfig);

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
				const testMessage = `test message before switching auth header ${Date.now()}`;

				visitHome();

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
				const parleyConfig = {userAdditionalInformation: {"some-key": "some-value"}};
				const testMessage = `test message before switching userAdditionalInformation ${Date.now()}`;

				visitHome(parleyConfig);

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

					visitHome(parleyConfig);

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

					visitHome(parleyConfig);

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

					visitHome(parleyConfig);

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

					visitHome(parleyConfig);

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
				visitHome();

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
		describe("apiCustomHeaders", () => {
			it("should set the apiCustomHeader setting on window", () => {
				const parleyConfig = {
					apiCustomHeaders: {
						"x-custom-1": "1",
						"x-custom-2": "2",
					},
				};

				visitHome(parleyConfig);

				// Check if settings is set
				cy.window().then((win) => {
					expect(win.parleySettings.apiCustomHeaders).to.deep.equal(parleyConfig.apiCustomHeaders);
				});
			});
			it("should update the custom headers during runtime", () => {
				const parleyConfig = {apiCustomHeaders: {"x-custom-1": "1"}};
				const newCustomHeader = {"x-custom-3": "2"};

				visitHome(parleyConfig);

				cy.get("[id=app]").as("app");

				cy.waitFor("@app");

				cy.window().then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.apiCustomHeaders = newCustomHeader;
				});

				cy.intercept("POST", "*/**/devices").as("postDevices");

				// We have to clear the local storage after the first registration
				// otherwise there won't be another POST /devices call because
				// the device information in the storage is the same as current
				cy.clearLocalStorage()
					.then(clickOnLauncher)
					.then(() => {
						return cy.wait("@postDevices").then((interception) => {
							expect(interception.request.headers).to.include(newCustomHeader);
						});
					});
			});
		});
		describe("persistDeviceBetweenDomain", () => {
			beforeEach(() => {
				Cypress.Cookies.debug(true);
			});
			it("should create a cookie, containing the deviceIdentification and with the persistDeviceBetweenDomain as domain, upon opening the chat", () => {
				const parleyConfig = {
					persistDeviceBetweenDomain: "parley.nu",
					xIrisIdentification: "12345678910",
				};

				cy.intercept("POST", "*/**/devices").as("postDevices");
				cy.intercept("GET", "*/**/messages").as("getMessages");

				visitHome(parleyConfig);

				clickOnLauncher();

				cy.wait("@postDevices")
					.then(() => {
						return cy.wait("@getMessages");
					})
					.then(() => {
						return cy.getCookies()
							.should("have.length", 1)
							.then((cookies) => {
								expect(cookies[0]).to.have.property("name", `deviceIdentification`);
								expect(cookies[0]).to.have.property("domain", `.${parleyConfig.persistDeviceBetweenDomain}`);
								expect(cookies[0]).to.have.property("value", `${parleyConfig.xIrisIdentification}`);
							});
					});
			});
			it("should update the persistDeviceBetweenDomain during runtime", () => {
				const parleyConfig = {persistDeviceBetweenDomain: "parley.nu"};

				// We can only use valid subdomain(s) here, otherwise the cookie
				// will not be visible for the domain we are currently running
				// the chat on...
				const newpersistDeviceBetweenDomain = "chat-dev.parley.nu";

				visitHome(parleyConfig);

				cy.intercept("POST", "*/**/devices").as("postDevices");
				cy.intercept("GET", "*/**/messages").as("getMessages");

				clickOnLauncher();

				// Check if the cookie is set after registration
				cy.wait("@postDevices")
					.then(() => cy.wait("@getMessages"))
					.then(() => cy.getCookies())
					.should("have.length", 1)
					.then((cookies) => {
						expect(cookies[0]).to.have.property("name", `deviceIdentification`);
						expect(cookies[0]).to.have.property("domain", `.${parleyConfig.persistDeviceBetweenDomain}`);
					})

					// Update the parleySettings and check if the cookie updated as well (after new registration)
					.then(cy.window)
					.then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.persistDeviceBetweenDomain = newpersistDeviceBetweenDomain;
					})
					.then(() => cy.wait("@postDevices"))
					.then(() => cy.wait("@getMessages"))
					.then(() => cy.getCookies())
					.should("have.length", 1)
					.then((cookies) => {
						expect(cookies[0]).to.have.property("name", `deviceIdentification`);
						expect(cookies[0]).to.have.property("domain", `.${newpersistDeviceBetweenDomain}`);
					});
			});

			describe("switching between domains", () => {
				before(() => {
					// Set the cookie to be used by the test
					// We can't let the library do this because somehow that cookie always gets removed
					// even with `Cypress.Cookies.preserveOnce("deviceIdentification");`
					// I think because the cookie is not created in the `before()` but in an `it()`
					cy.setCookie("deviceIdentification", "some-device-identification-string", {
						domain: ".parley.nu",
						path: "/",
					});
				});

				it("should use the value, in the cookie, as it's initial device identification", () => {
					const parleyConfig = {persistDeviceBetweenDomain: "parley.nu"};

					visitHome(parleyConfig);

					cy.get("[id=app]").as("app");
					cy.waitFor("@app");

					cy.intercept("GET", "*/**/messages").as("getMessages");

					cy.getCookie("deviceIdentification")
						.then((cookie) => {
							const deviceIdentificationFromCookie = cookie.value;

							clickOnLauncher(); // Start the device registration

							// We know that if we start retrieving messages,
							// the device registration is completely finished
							// meaning that the cookie has been updated
							cy.wait("@getMessages")
								.then((interception) => {
									expect(interception.request.headers).to.have.property("x-iris-identification", `${defaultParleyConfig.roomNumber}:${deviceIdentificationFromCookie}`);
								});
						});
				});
			});
		});
	});
});
