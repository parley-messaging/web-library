import {InterfaceTexts} from "../../src/UI/Scripts/Context";
import {version} from "../../package.json";
import {interceptIndefinitely} from "../support/utils";

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
				.should("have.text", "Something went wrong, please try again later");
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
			}).as("postDevices");

			visitHome();
			clickOnLauncher();

			// Validate that api error is visible
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=error__]")
				.should("be.visible")
				.should("have.text", "Something went wrong while registering your device, please re-open the chat to try again");

			// Re-open the chat
			clickOnLauncher(); // hide
			clickOnLauncher(); // show

			// Validate that the chat retries the subscribe call
			cy.wait("@postDevices")
				.its("response")
				.should("have.property", "statusCode", 400);
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

		it("should re-enable the input field after sending the message is successful", () => {
			const testMessage = `Test message ${Date.now()}`;

			const interception = interceptIndefinitely("POST", "*/**/messages");

			visitHome();
			clickOnLauncher();
			sendMessage(testMessage);

			// Validate that the text area is disabled
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=footer__]")
				.should("be.visible")
				.find("[class^=text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.disabled")
				.then(interception.sendResponse);

			findMessage(testMessage);

			// Validate that the textarea is enabled
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=footer__]")
				.should("be.visible")
				.find("[class^=text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.enabled");
		});

		it("should re-enable the input field after sending the message is unsuccessful", () => {
			const testMessage = `Test message ${Date.now()}`;

			// Make sure that posting the message fails
			const interception = interceptIndefinitely("POST", "*/**/messages", {
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

			// Validate that the text area is disabled
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=footer__]")
				.should("be.visible")
				.find("[class^=text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.disabled")
				.then(interception.sendResponse);

			// Validate that the text area is enabled
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=footer__]")
				.should("be.visible")
				.find("[class^=text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.enabled");
		});

		it("should not disable the input field when trying to send an empty message", () => {
			const testMessage = "";

			visitHome();
			clickOnLauncher();
			sendMessage(testMessage);

			// It is not possible to check if the POST /messages request is
			// NOT done, so all we can do is check if the text area
			// is enabled below...

			// Validate that the textarea is enabled
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=footer__]")
				.should("be.visible")
				.find("[class^=text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.enabled");
		});

		it("should keep the input field disabled, after submitting a message, while device registration is not finished", () => {
			const testMessage = `Test message ${Date.now()}`;

			const interception = interceptIndefinitely("POST", "*/**/devices");

			visitHome();
			clickOnLauncher();
			sendMessage(testMessage);

			// Validate that the text area is disabled
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=footer__]")
				.should("be.visible")
				.find("[class^=text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.disabled")
				.then(interception.sendResponse);

			findMessage(testMessage);

			// Validate that the textarea is enabled
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=footer__]")
				.should("be.visible")
				.find("[class^=text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.enabled");
		});

		it("should keep the input field disabled, after submitting a message and closing/opening the chat window, while device registration is not finished", () => {
			const testMessage = `Test message ${Date.now()}`;

			const interception = interceptIndefinitely("POST", "*/**/devices");

			visitHome();
			clickOnLauncher();
			sendMessage(testMessage);

			// Validate that the text area is disabled
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=footer__]")
				.should("be.visible")
				.find("[class^=text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.disabled");

			clickOnLauncher(); // Hide chat
			clickOnLauncher(); // Show chat

			// Validate that the text area is still disabled
			// and then continue the subscribe call
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=footer__]")
				.should("be.visible")
				.find("[class^=text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.disabled")
				.then(interception.sendResponse);

			findMessage(testMessage);

			// Validate that the textarea is enabled
			cy.get("@app")
				.find("[class^=chat__]")
				.should("be.visible")
				.find("[class^=footer__]")
				.should("be.visible")
				.find("[class^=text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.enabled");
		});
	});
	describe("receiving messages", () => {
		it("should render images when received", () => {
			visitHome();

			// Intercept GET messages and return a fixture message with an image in it
			cy.intercept("GET", "*/**/messages", {fixture: "getMessageWithImageResponse.json"});

			// Intercept the request for the image binary
			cy.intercept("GET", "*/**/media/**/*", {fixture: "image.png"});

			clickOnLauncher();

			cy.get("@app")
				.find("[class^=message__]")
				.should("have.length", 2)
				.find("input[type=image]")
				.should("have.length", 2)
				.should("exist");
		});
		it("should render an error message for unsupported media types", () => {
			visitHome();

			// Intercept GET messages and return a fixture message with an image in it
			cy.intercept("GET", "*/**/messages", {fixture: "getMessageWithPdfResponse.json"})
				.as("getMessages");

			clickOnLauncher();

			cy.wait("@getMessages");

			cy.get("@app")
				.find("[class^=message__]")
				.should("be.visible")
				.find("p")
				.should("have.text", "Unsupported media");
		});
		it("should render an error message when the image cannot be loaded", () => {
			visitHome();

			// Intercept GET messages and return a fixture message with an image in it
			cy.intercept("GET", "*/**/messages", {fixture: "getMessageWithImageResponse.json"})
				.as("getMessages");

			// Don't intercept GET /media and let the API give use the error we want

			clickOnLauncher();

			cy.wait("@getMessages");

			cy.get("@app")
				.find("[class^=message__]")
				.first()
				.should("be.visible")
				.find("p")
				.should("have.text", "Unable to load media");
		});
	});
	describe("parley config settings", () => {
		describe("runOptions", () => {
			describe("icon", () => {
				it("should change the icon of the launcher", () => {
					// Load startup icon
					cy.fixture("custom-chat-icon1.png").then((logo) => {
						return `data:image/png;base64,${logo}`;
					})
						.as("startupIcon");

					// Set startup icon as icon, in the config, before loading the chat
					// and load the chat
					cy.get("@startupIcon").then((startupIcon) => {
						visitHome({runOptions: {icon: startupIcon}});
					});

					// Check that the icon is changed
					cy.get("@startupIcon").then((startupIcon) => {
						cy.get("#launcher")
							.find("img")
							.should("exist")
							.and("have.attr", "src", startupIcon);
					});

					// Check that the default svg "icon" is not visible
					cy.get("#launcher")
						.find("svg")
						.should("not.exist");

					// Load a new icon
					cy.fixture("custom-chat-icon2.png").then((logo) => {
						return `data:image/png;base64,${logo}`;
					})
						.as("newIcon");

					// Change the icon to the new icon during runtime
					cy.get("@newIcon").then((newIcon) => {
						cy.window().then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.icon = newIcon;
						});
					});

					// Check that the icon is changed (during runtime)
					cy.get("@newIcon").then((newIcon) => {
						cy.get("#launcher")
							.find("img")
							.should("exist")
							.and("have.attr", "src", newIcon);
					});

					// We don't really need an extra check for the absence of the svg "icon"
					// since that is already checked above
				});
				it("should use the default icon of the launcher", () => {
					visitHome();
					cy.get("#launcher")
						.find("svg")
						.should("exist");

					cy.get("#launcher")
						.find("img")
						.should("not.exist");
				});
				it("should convert the default logo to custom logo and back again", () => {
					visitHome();
					cy.get("#launcher")
						.find("svg")
						.should("exist");

					cy.get("#launcher")
						.find("img")
						.should("not.exist");

					// Load a new icon
					cy.fixture("custom-chat-icon1.png").then((logo) => {
						return `data:image/png;base64,${logo}`;
					})
						.as("newIcon");

					// Change the icon to the new icon during runtime
					cy.get("@newIcon").then((newIcon) => {
						cy.window().then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.icon = newIcon;
						});
					});

					// Check that the icon is changed (during runtime)
					cy.get("@newIcon").then((newIcon) => {
						cy.get("#launcher")
							.find("img")
							.should("exist")
							.and("have.attr", "src", newIcon);
					});

					// Remove custom icon during runtime
					cy.window().then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.runOptions.icon = undefined;
					});

					cy.get("#launcher")
						.find("svg")
						.should("exist");

					cy.get("#launcher")
						.find("img")
						.should("not.exist");
				});
			});
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
			it("should clear the messages when switching accounts", () => {
				const parleyConfig = {roomNumber: "0cce5bfcdbf07978b269"};
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

				// Change the account identification
				const newAccountIdentification = "0W4qcE5aXoKq9OzvHxj2";
				cy.window().then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.roomNumber = newAccountIdentification;
				});

				cy.get("@app")
					.find("[class^=wrapper__]")
					.should("be.visible")
					.find("[class^=body__]")
					.should("be.visible")
					.should("not.contain", testMessage);
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
			it("should not re-register the device when the changes contains no differences", () => {
				// eslint-disable-next-line no-unused-vars
				const log = "[parley-web-library:DEBUG] Registering new device";
				const parleyConfig = {userAdditionalInformation: {"some-key": "some-value"}};
				visitHome(parleyConfig);
				cy.get("[id=app]").as("app");

				// creates the first device subscription call
				clickOnLauncher();

				// set the additional information
				cy.window().then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.userAdditionalInformation = {"some-key": "some-value"};
				});

				// Retrieve the captured debug messages
				cy.window().then((win) => {
					const capturedDebugMessages = win.__capturedDebugMessages;

					// we would only expect 1 device subscription call in total
					const actualCount = capturedDebugMessages.filter(msg => msg.includes(log)).length;
					expect(actualCount).to.equal(1);
				});
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
							"Monday", 0.00, 23.59,
						],
						[
							"Tuesday", 0.00, 23.59,
						],
						[
							"Wednesday", 0.00, 23.59,
						],
						[
							"Thursday", 0.00, 23.59,
						],
						[
							"Friday", 0.00, 23.59,
						],
						[
							"Saturday", 0.00, 23.59,
						],
						[
							"Sunday", 0.00, 23.59,
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
			describe("format [day, start, end, true]", () => {
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
							"Monday", 0.00, 23.59, true,
						],
						[
							"Tuesday", 0.00, 23.59, true,
						],
						[
							"Wednesday", 0.00, 23.59, true,
						],
						[
							"Thursday", 0.00, 23.59, true,
						],
						[
							"Friday", 0.00, 23.59, true,
						],
						[
							"Saturday", 0.00, 23.59, true,
						],
						[
							"Sunday", 0.00, 23.59, true,
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
			describe("format [day, start, end, false]", () => {
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
							"Monday", 0.00, 0.00, false,
						],
						[
							"Tuesday", 0.00, 0.00, false,
						],
						[
							"Wednesday", 0.00, 0.00, false,
						],
						[
							"Thursday", 0.00, 0.00, false,
						],
						[
							"Friday", 0.00, 0.00, false,
						],
						[
							"Saturday", 0.00, 0.00, false,
						],
						[
							"Sunday", 0.00, 0.00, false,
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
							// Make sure both headers are used and not only the new one
							expect(interception.request.headers).to.include(parleyConfig.apiCustomHeaders);
							expect(interception.request.headers).to.include(newCustomHeader);
						});
					});
			});
			it("should not update the custom headers when the new header contains no differences", () => {
				const log = "[parley-web-library:DEBUG] Api custom headers changed, setting new custom headers";
				const parleyConfig = {apiCustomHeaders: {"X-CookiesOK": 1}};
				visitHome(parleyConfig);
				cy.get("[id=app]").as("app");
				clickOnLauncher();

				cy.window().then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.apiCustomHeaders = {"X-CookiesOK": 1};
				});

				// Retrieve the captured debug messages
				cy.window().then((win) => {
					const capturedDebugMessages = win.__capturedDebugMessages;

					// We would not expect an API custom header log since it already was set
					const actualCount = capturedDebugMessages.filter(msg => msg.includes(log)).length;
					expect(actualCount).to.equal(0);
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
					const deviceIdentification = "some-device-identification-string";

					// We also need to put this cookie in the middle of other cookies,
					// so we can test if we can find cookies in the middle of cookie strings
					cy.setCookie("dummyCookie1", "dummy value", {
						domain: ".parley.nu",
						path: "/",
					});

					cy.setCookie("deviceIdentification", deviceIdentification, {
						domain: ".parley.nu",
						path: "/",
					});

					cy.setCookie("dummyCookie2", "dummy value", {
						domain: ".parley.nu",
						path: "/",
					});

					// Make the device identification accessible by the tests
					cy.wrap(deviceIdentification).as("deviceIdentification");
				});

				it("should use the value, in the cookie, as it's initial device identification", () => {
					const parleyConfig = {persistDeviceBetweenDomain: "parley.nu"};

					visitHome(parleyConfig);

					cy.get("[id=app]").as("app");
					cy.waitFor("@app");

					cy.intercept("GET", "*/**/messages").as("getMessages");

					clickOnLauncher(); // Start the device registration

					// We know that if we start retrieving messages,
					// the device registration is completely finished
					// meaning that the cookie has been updated
					cy.wait("@getMessages")
						.then((interception) => {
							return cy.get("@deviceIdentification")
								.then((deviceIdentificationFromCookie) => {
									expect(interception.request.headers).to.have.property("x-iris-identification", `${defaultParleyConfig.roomNumber}:${deviceIdentificationFromCookie}`);
								});
						});
				});
			});
		});
	});
	describe("component structure", () => {
		beforeEach(() => {
			cy.visit("/", {
				onLoad: (window) => {
					window.initParleyMessenger();
				},
			});

			cy.get("[id=app]").as("app");
		});

		describe("launcher", () => {
			it("should have an id", () => {
				cy.get("@app")
					.find("[class^=launcher__]")
					.find("button")
					.should("have.id", "launcher");
			});
		});
	});
	describe("local storage", () => {
		[
			"",
			"some-authorization",
		].forEach((authorization) => {
			it(`should contain expected values (${authorization ? "Logged in user" : "Anonymous user"})`, () => {
				const parleyConfig = {userAdditionalInformation: {"some-key": "some-value"}};
				const testMessage = `test message localstorage authorized user ${Date.now()}`;
				const apiVersion = "v1.6";

				visitHome(parleyConfig);
				cy.get("[id=app]").as("app");
				cy.window().then((win) => {
					const window = {...win};
					window.parleySettings.authHeader = authorization;
					window.parleySettings.apiVersion = apiVersion;
				});
				clickOnLauncher();
				sendMessage(testMessage);
				cy.window().then((win) => {
					// get the Parley setting information which was created inside the local storage
					cy.wrap(win.localStorage.getItem("deviceInformation")).then((value) => {
						const parsedValue = JSON.parse(value);
						cy.wrap(parsedValue.deviceIdentification).should("exist");
						cy.wrap(parsedValue.accountIdentification).should("not.exist");
						cy.wrap(parsedValue.userAdditionalInformation).should("not.exist");
						cy.wrap(parsedValue.authorization).should("not.exist");
						cy.wrap(parsedValue.version).should("not.exist");
						cy.wrap(parsedValue.type).should("not.exist");
						cy.wrap(parsedValue.pushToken).should("not.exist");
						cy.wrap(parsedValue.pushType).should("not.exist");
						cy.wrap(parsedValue.pushEnabled).should("not.exist");
						cy.wrap(parsedValue.referer).should("not.exist");
					});
				});
			});
		});
	});
	describe("chat open state", () => {
		it("should save the value 'minimize' when there is no localstorage value available", () => {
			visitHome();

			// Check if the localStorage value minimize exists
			cy.window()
				.then((win) => {
					const storedValue = win.localStorage.getItem("messengerOpenState");
					expect(storedValue)
						.to
						.equal("minimize");
				});
		});
		it("should save the value 'open' when the chat has been opened and also when the page is refreshed", () => {
			visitHome();
			clickOnLauncher();

			// Check if the localStorage value is set to open
			cy.window()
				.then((win) => {
					const storedValue = win.localStorage.getItem("messengerOpenState");
					expect(storedValue)
						.to
						.equal("open");
				});
			cy.reload();

			// Check if the localStorage value open still exists after refresh
			cy.window()
				.then((win) => {
					const storedValue = win.localStorage.getItem("messengerOpenState");
					expect(storedValue)
						.to
						.equal("open");
				});

			// Check if the chat is visible
			cy.get("#app")
				.get("#chat")
				.should("exist");
		});
		it("should save the value 'minimize' when the chat is hidden and also when the page is refreshed", () => {
			visitHome();

			// Open chat
			clickOnLauncher();

			// Minimize chat
			clickOnLauncher();

			// Check if the localStorage value is set to minimize
			cy.window()
				.then((win) => {
					const storedValue = win.localStorage.getItem("messengerOpenState");
					expect(storedValue)
						.to
						.equal("minimize");
				});
			cy.reload();

			// Check if the localStorage value minimize still exists after refresh
			cy.window()
				.then((win) => {
					const storedValue = win.localStorage.getItem("messengerOpenState");
					expect(storedValue)
						.to
						.equal("minimize");
				});

			// Wait until the app is loaded
			// Otherwise the "#chat should not exist" will pass
			// immediately before the chat has been initialized
			cy.get("#app")
				.find("[class^=launcher__]")
				.find("button")
				.should("be.visible");

			// Check if the chat is not visible
			cy.get("#chat")
				.should("not.be.visible");
		});
		describe("launcher component css class", () => {
			it("should contain the class name 'state-minimize' when the chat has not been opened'", () => {
				visitHome();
				cy.get("#app")
					.find('div[class*="state-minimize"]')
					.should("exist");
				cy.get("#app")
					.find('div[class*="state-open"]')
					.should("not.exist");
			});
			it("should contain the class name 'state-open' when the chat has been opened'", () => {
				visitHome();
				clickOnLauncher();
				cy.get("#app")
					.find('div[class*="state-open"]')
					.should("exist");
				cy.get("#app")
					.find('div[class*="state-minimize"]')
					.should("not.exist");
			});
		});
	});
	describe("images", () => {
		it("should open the fullscreen view on click and close it with the close button", () => {
			visitHome();

			// Intercept GET messages and return a fixture message with an image in it
			cy.intercept("GET", "*/**/messages", {fixture: "getMessageWithImageResponse.json"});

			// Intercept the request for the image binary
			cy.intercept("GET", "*/**/media/**/*", {fixture: "image.png"});

			clickOnLauncher();

			// Find image and click on it
			cy.get("@app")
				.find("[class^=message__]")
				.find("input[type=image]")
				.first()
				.click();

			// Find fullscreen image container
			// and close it
			cy.get("@app")
				.find("[class^=container__]")
				.should("be.visible")
				.find("img[class^=image]")
				.should("be.visible")
				.parent()
				.find("button[class^=closeButton__]")
				.should("be.visible")
				.click();

			// Make sure image container is gone
			cy.get("@app")
				.find("[class^=container__]")
				.should("not.exist");
		});
	});
});
