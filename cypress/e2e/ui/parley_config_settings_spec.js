import {InterfaceTexts} from "../../../src/UI/Scripts/Context";
import {SUPPORTED_MEDIA_TYPES} from "../../../src/Api/Constants/SupportedMediaTypes";
import {STATUS_AVAILABLE} from "../../../src/Api/Constants/Statuses";
import {
	_afterEach,
	_beforeEach,
	clickOnLauncher, defaultParleyConfig,
	findMessage,
	interceptIndefinitely, messagesUrlRegex,
	sendMessage, visitHome,
} from "../../support/utils";
import {version} from "../../../package.json";

function getCookiesFiltered(cookies) {
	// Filter out any cookies created by dev dependencies
	return cookies.filter(x => x.name !== "_dd_s");
}

beforeEach(_beforeEach);
afterEach(_afterEach);

describe("parley config settings", () => {
	describe("runOptions", () => {
		describe("icon", () => {
			it("should change the icon of the launcher", () => {
				// Load startup icon
				cy.fixture("custom-chat-icon1.png")
					.then((logo) => {
						return `data:image/png;base64,${logo}`;
					})
					.as("startupIcon");

				// Set startup icon as icon, in the config, before loading the chat
				// and load the chat
				cy.get("@startupIcon")
					.then((startupIcon) => {
						visitHome({runOptions: {icon: startupIcon}});
					});

				// Check that the icon is changed
				cy.get("@startupIcon")
					.then((startupIcon) => {
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
				cy.fixture("custom-chat-icon2.png")
					.then((logo) => {
						return `data:image/png;base64,${logo}`;
					})
					.as("newIcon");

				// Change the icon to the new icon during runtime
				cy.get("@newIcon")
					.then((newIcon) => {
						cy.window()
							.then((win) => {
								// eslint-disable-next-line no-param-reassign
								win.parleySettings.runOptions.icon = newIcon;
							});
					});

				// Check that the icon is changed (during runtime)
				cy.get("@newIcon")
					.then((newIcon) => {
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
				cy.fixture("custom-chat-icon1.png")
					.then((logo) => {
						return `data:image/png;base64,${logo}`;
					})
					.as("newIcon");

				// Change the icon to the new icon during runtime
				cy.get("@newIcon")
					.then((newIcon) => {
						cy.window()
							.then((win) => {
								// eslint-disable-next-line no-param-reassign
								win.parleySettings.runOptions.icon = newIcon;
							});
					});

				// Check that the icon is changed (during runtime)
				cy.get("@newIcon")
					.then((newIcon) => {
						cy.get("#launcher")
							.find("img")
							.should("exist")
							.and("have.attr", "src", newIcon);
					});

				// Remove custom icon during runtime
				cy.window()
					.then((win) => {
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

					cy.get("[id=app]")
						.as("app");

					clickOnLauncher();

					cy.get("@app")
						.find("[class^=parley-messaging-title__]")
						.should("have.text", parleyConfig.runOptions.interfaceTexts.desc);

					// Test if it changes during runtime
					const newTitle = "This is the title bar #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.desc = newTitle;
						});

					cy.get("@app")
						.find("[class^=parley-messaging-title__]")
						.should("have.text", newTitle);
				});
			});
			describe("title (new name for 'desc')", () => {
				it("should change the title text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {title: "This is the title bar"}}};

					visitHome(parleyConfig);

					cy.get("[id=app]")
						.as("app");

					clickOnLauncher();

					cy.get("@app")
						.find("[class^=parley-messaging-title__]")
						.should("have.text", parleyConfig.runOptions.interfaceTexts.title);

					// Test if it changes during runtime
					const newTitle = "This is the title bar #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.desc = newTitle;
						});

					cy.get("@app")
						.find("[class^=parley-messaging-title__]")
						.should("have.text", newTitle);
				});
			});
			describe("infoText", () => {
				it("should change the welcome message", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {infoText: "This is the info text"}}};

					// To test this we need to ignore the API's `welcomeMessage`
					cy.fixture("getMessagesResponse.json")
						.then((json) => {
							const _json = {
								...json,
								welcomeMessage: null,
							};
							cy.intercept("GET", messagesUrlRegex, _json)
								.as("getMessages");
						});

					visitHome(parleyConfig);

					cy.get("[id=app]")
						.as("app");

					clickOnLauncher();

					cy.get("@app")
						.find("[class*=parley-messaging-announcement__]")
						.first()
						.should("have.text", parleyConfig.runOptions.interfaceTexts.infoText);

					// Test if it changes during runtime
					const newInfoText = "This is the info text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.infoText = newInfoText;
						});

					cy.wait("@getMessages");

					cy.get("@app")
						.find("[class*=parley-messaging-announcement__]")
						.first()
						.should("have.text", newInfoText);
				});
				it("should get overridden by API's welcomeMessage", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {infoText: "This is the info text"}}};
					const welcomeMessage = "This is the API's welcome message";

					// To test this we need to change the API's `welcomeMessage`
					cy.fixture("getMessagesResponse.json")
						.then((json) => {
							const _json = {
								...json,
								welcomeMessage,
							};
							cy.intercept("GET", messagesUrlRegex, _json);
						});

					visitHome(parleyConfig);

					cy.get("[id=app]")
						.as("app");

					clickOnLauncher();

					cy.get("@app")
						.find("[class*=parley-messaging-announcement__]")
						.first()
						.should("have.text", welcomeMessage);
				});
				it("should only show welcomeMessage after GET /messages call", () => {
					// Force a long delay on the response to pretend we are "loading"
					// This delay should have no impact on the test duration, because
					// the test will end after we've done our assertion which doesn't
					// have to wait on the response. It's just there to assert the
					// "loading" state
					cy.fixture("getMessagesResponse.json")
						.then((json) => {
							cy.intercept("GET", messagesUrlRegex, (req) => {
								req.reply({
									statusCode: 200,
									body: {...json},
									delay: 5000,
								});
							});
						});

					visitHome();

					cy.get("[id=app]")
						.as("app");

					clickOnLauncher();

					// We should not see any announcements while the request is "busy"
					cy.get("@app")
						.find("[class*=parley-messaging-announcement__]")
						.should("not.exist");
				});
			});
			describe("welcomeMessage (new name for 'infoText')", () => {
				it("should change the welcome message", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {welcomeMessage: "This is the info text"}}};

					// To test this we need to ignore the API's `welcomeMessage`
					cy.fixture("getMessagesResponse.json")
						.then((json) => {
							const _json = {
								...json,
								welcomeMessage: null,
							};
							cy.intercept("GET", /.*\/messages(?:\/after:\d+)?/u, _json);
						});

					visitHome(parleyConfig);

					cy.get("[id=app]")
						.as("app");

					clickOnLauncher();

					cy.get("@app")
						.find("[class*=parley-messaging-announcement__]")
						.first()
						.should("have.text", parleyConfig.runOptions.interfaceTexts.welcomeMessage);

					// Test if it changes during runtime
					const newValue = "This is the info text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.welcomeMessage = newValue;
						});

					cy.get("@app")
						.find("[class*=parley-messaging-announcement__]")
						.first()
						.should("have.text", newValue);
				});
			});
			describe("placeholderMessenger", () => {
				it("should change the input's placeholder text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {placeholderMessenger: "This is the placeholder"}}};

					visitHome(parleyConfig);

					cy.get("[id=app]")
						.as("app");

					clickOnLauncher();

					cy.get("@app")
						.find("[class^=parley-messaging-text__]")
						.find("textarea")
						.should("have.attr", "placeholder", parleyConfig.runOptions.interfaceTexts.placeholderMessenger);

					// Test if it changes during runtime
					const newPlaceholder = "This is the placeholder #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.placeholderMessenger = newPlaceholder;
						});

					cy.get("@app")
						.find("[class^=parley-messaging-text__]")
						.find("textarea")
						.should("have.attr", "placeholder", newPlaceholder);
				});
			});
			describe("inputPlaceholder (new name for 'placeholderMessenger')", () => {
				it("should change the input's placeholder text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {inputPlaceholder: "This is the placeholder"}}};

					visitHome(parleyConfig);

					cy.get("[id=app]")
						.as("app");

					clickOnLauncher();

					cy.get("@app")
						.find("[class^=parley-messaging-text__]")
						.find("textarea")
						.should("have.attr", "placeholder", parleyConfig.runOptions.interfaceTexts.inputPlaceholder);

					// Test if it changes during runtime
					const newPlaceholder = "This is the placeholder #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.inputPlaceholder = newPlaceholder;
						});

					cy.get("@app")
						.find("[class^=parley-messaging-text__]")
						.find("textarea")
						.should("have.attr", "placeholder", newPlaceholder);
				});
			});
			describe("ariaLabelButtonMinimize", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {ariaLabelButtonMinimize: "Custom text"}}};

					visitHome(parleyConfig);
					clickOnLauncher();

					cy.get("@app")
						.find("[class*=parley-messaging-minimize__]")
						.as("minimizeButton")
						.should("have.attr", "aria-label")
						.should("equal", parleyConfig.runOptions.interfaceTexts.ariaLabelButtonMinimize);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.ariaLabelButtonMinimize = newValue;
						});

					cy.get("@minimizeButton")
						.should("have.attr", "aria-label")
						.should("equal", newValue);
				});
			});
			describe("ariaLabelButtonLauncher", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {ariaLabelButtonLauncher: "Custom text"}}};

					visitHome(parleyConfig);
					clickOnLauncher();

					cy.get("@app")
						.find("#launcher")
						.as("elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", parleyConfig.runOptions.interfaceTexts.ariaLabelButtonLauncher);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.ariaLabelButtonLauncher = newValue;
						});

					cy.get("@elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", newValue);
				});
			});
			describe("ariaLabelButtonErrorClose", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {ariaLabelButtonErrorClose: "Custom text"}}};

					cy.intercept("POST", "*/**/messages", {
						statusCode: 400,
						body: {status: "ERROR"},
					});

					visitHome(parleyConfig);
					clickOnLauncher();
					sendMessage("test message");

					cy.get("@app")
						.find("[class^=parley-messaging-error__]")
						.find("button")
						.as("elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", parleyConfig.runOptions.interfaceTexts.ariaLabelButtonErrorClose);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.ariaLabelButtonErrorClose = newValue;
						});

					cy.get("@elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", newValue);
				});
			});
			describe("ariaLabelTextInput", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {ariaLabelTextInput: "Custom text"}}};

					visitHome(parleyConfig);

					clickOnLauncher();

					cy.get("@app")
						.find("[class^=parley-messaging-text__]")
						.find("textarea")
						.as("elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", parleyConfig.runOptions.interfaceTexts.ariaLabelTextInput);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.ariaLabelTextInput = newValue;
						});

					cy.get("@elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", newValue);
				});
			});
			describe("ariaLabelMessageTitle", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {ariaLabelMessageTitle: "Custom text"}}};

					cy.intercept("GET", messagesUrlRegex, {fixture: "getMessageWithTitleResponse"});

					visitHome(parleyConfig);

					clickOnLauncher();

					cy.get("@app")
						.find("[class^=parley-messaging-message__]")
						.children()
						.first()
						.as("elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", parleyConfig.runOptions.interfaceTexts.ariaLabelMessageTitle);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.ariaLabelMessageTitle = newValue;
						});

					cy.get("@elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", newValue);
				});
			});
			describe("ariaLabelMessageBody", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {ariaLabelMessageBody: "Custom text"}}};

					cy.intercept("GET", messagesUrlRegex, {fixture: "getMessageWithTitleResponse"});

					visitHome(parleyConfig);

					clickOnLauncher();

					cy.get("@app")
						.find("[class^=parley-messaging-message__]")
						.children()
						.eq(1)
						.as("elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", parleyConfig.runOptions.interfaceTexts.ariaLabelMessageBody);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.ariaLabelMessageBody = newValue;
						});

					cy.get("@elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", newValue);
				});
			});
			describe("ariaLabelMessageMedia", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {ariaLabelMessageMedia: "Custom text"}}};

					cy.intercept("GET", messagesUrlRegex, {fixture: "getMessageWithImageResponse"});
					cy.intercept("GET", "*/**/media/**/*", {fixture: "image.png"});

					visitHome(parleyConfig);

					clickOnLauncher();

					cy.get("@app")
						.find("[class^=parley-messaging-message__]")
						.children()
						.eq(3)
						.as("elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", parleyConfig.runOptions.interfaceTexts.ariaLabelMessageMedia);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.ariaLabelMessageMedia = newValue;
						});

					cy.get("@elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", newValue);
				});
			});
			describe("ariaLabelMessageButtons", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {ariaLabelMessageButtons: "Custom text"}}};

					cy.intercept("GET", messagesUrlRegex, {fixture: "getMessageWithButtonsResponse"});

					visitHome(parleyConfig);

					clickOnLauncher();

					cy.get("@app")
						.find("[class^=parley-messaging-message__]")
						.children()
						.eq(0)
						.as("elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", parleyConfig.runOptions.interfaceTexts.ariaLabelMessageButtons);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.ariaLabelMessageButtons = newValue;
						});

					cy.get("@elementUnderTest")
						.should("have.attr", "aria-label")
						.should("equal", newValue);
				});
			});
			describe("retrievingMessagesFailedError", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {retrievingMessagesFailedError: "Custom text"}}};

					cy.intercept("GET", messagesUrlRegex, {
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
					})
						.as("getMessages");

					visitHome(parleyConfig);
					clickOnLauncher();

					cy.wait("@getMessages");

					cy.get("@app")
						.find("[class^=parley-messaging-error__]")
						.as("elementUnderTest")
						.should("have.text", parleyConfig.runOptions.interfaceTexts.retrievingMessagesFailedError);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.retrievingMessagesFailedError = newValue;
						});

					cy.get("@elementUnderTest")
						.should("have.text", newValue);
				});
			});
			describe("subscribeDeviceFailedError", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {subscribeDeviceFailedError: "Custom text"}}};

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
					})
						.as("postDevices");

					visitHome(parleyConfig);
					clickOnLauncher();
					cy.wait("@postDevices");

					cy.get("@app")
						.find("[class^=parley-messaging-error__]")
						.as("elementUnderTest")
						.should("have.text", parleyConfig.runOptions.interfaceTexts.subscribeDeviceFailedError);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.subscribeDeviceFailedError = newValue;
						});

					cy.get("@elementUnderTest")
						.find("button")
						.click(); // Close alert first

					clickOnLauncher(); // Close chat
					clickOnLauncher(); // Open chat
					cy.wait("@postDevices");

					cy.get("@elementUnderTest")
						.should("have.text", newValue);
				});
			});
			describe("serviceGenericError", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {serviceGenericError: "Custom text"}}};

					cy.intercept("POST", "*/**/messages", {
						statusCode: 400,
						body: {status: "ERROR"},
					})
						.as("postMessage");

					visitHome(parleyConfig);
					clickOnLauncher();
					sendMessage("test message");
					cy.wait("@postMessage");

					cy.get("@app")
						.find("[class^=parley-messaging-error__]")
						.as("elementUnderTest")
						.should("have.text", parleyConfig.runOptions.interfaceTexts.serviceGenericError);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.serviceGenericError = newValue;
						});

					cy.get("@elementUnderTest")
						.find("button")
						.click(); // Close alert first

					clickOnLauncher(); // Close chat
					clickOnLauncher(); // Open chat
					sendMessage("test message 2");
					cy.wait("@postMessage");

					cy.get("@elementUnderTest")
						.should("have.text", newValue);
				});
			});
			describe("deviceRequiresAuthorizationError", () => {
				it("should change the error message", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {deviceRequiresAuthorizationError: "This is the deviceRequiresAuthorizationError text"}}};

					cy.intercept("GET", messagesUrlRegex, {
						statusCode: 400,
						body: {
							status: "ERROR",
							notifications: [
								{
									type: "error",
									message: "device_requires_authorization",
								},
							],
						},
					});

					visitHome(parleyConfig);
					clickOnLauncher();

					// Validate that api error is visible
					cy.get("@app")
						.find("[class^=parley-messaging-chat__]")
						.should("be.visible")
						.find("[class^=parley-messaging-error__]")
						.as("error")
						.should("be.visible")
						.should("have.text", parleyConfig.runOptions.interfaceTexts.deviceRequiresAuthorizationError)
						.find("button")
						.click(); // Close the error

					// Test if it changes during runtime
					const newErrorText = "This is the error deviceRequiresAuthorizationError text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.deviceRequiresAuthorizationError
								= newErrorText;
						});

					// It is reactive like other texts. This error text is not set directly in the render.
					// It lives in the state, which is not directly linked to the context provider.
					// This means we have to trigger the thing that caused the error again,
					// in this case its retrieving the messages.
					clickOnLauncher(); // Close the chat
					clickOnLauncher(); // Reopen the chat to trigger the retrieval of messages

					cy.get("@error")
						.should("be.visible")
						.should("have.text", newErrorText);
				});
			});
			describe("ariaLabelUploadFile", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {ariaLabelUploadFile: "Custom text"}}};

					visitHome(parleyConfig);
					clickOnLauncher();

					cy.get("@app")
						.find("[class^=parley-messaging-uploadButton__]")
						.as("uploadLabel")
						.should("have.attr", "aria-label")
						.should("equal", parleyConfig.runOptions.interfaceTexts.ariaLabelUploadFile);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.ariaLabelUploadFile = newValue;
						});

					cy.get("@uploadLabel")
						.should("have.attr", "aria-label")
						.should("equal", newValue);
				});
			});
			describe("messageSendFailed", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {messageSendFailed: "Custom text"}}};
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
					visitHome(parleyConfig);
					clickOnLauncher();
					sendMessage(testMessage);

					cy.get("@app")
						.find("[class^=parley-messaging-error__]")
						.should("have.text", parleyConfig.runOptions.interfaceTexts.messageSendFailed);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.messageSendFailed = newValue;
						});

					sendMessage(testMessage);

					cy.get("@app")
						.find("[class^=parley-messaging-error__]")
						.should("have.text", newValue);
				});
			});
			describe("sendingMessageFailedError (new name for 'messageSendFailed')", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {sendingMessageFailedError: "Custom text"}}};
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
					visitHome(parleyConfig);
					clickOnLauncher();
					sendMessage(testMessage);

					cy.get("@app")
						.find("[class^=parley-messaging-error__]")
						.should("have.text", parleyConfig.runOptions.interfaceTexts.sendingMessageFailedError);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.sendingMessageFailedError = newValue;
						});

					sendMessage(testMessage);

					cy.get("@app")
						.find("[class^=parley-messaging-error__]")
						.should("have.text", newValue);
				});
			});
			describe("serviceUnreachableNotification", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {serviceUnreachableNotification: "Custom text"}}};
					const testMessage = `Test message ${Date.now()}`;

					cy.intercept("POST", "*/**/messages", {forceNetworkError: true});
					visitHome(parleyConfig);
					clickOnLauncher();
					sendMessage(testMessage);

					cy.get("@app")
						.find("[class^=parley-messaging-error__]")
						.should("have.text", parleyConfig.runOptions.interfaceTexts.serviceUnreachableNotification);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.serviceUnreachableNotification = newValue;
						});

					sendMessage(testMessage);

					cy.get("@app")
						.find("[class^=parley-messaging-error__]")
						.should("have.text", newValue);
				});
			});
			describe("serviceUnreachableError (new name for 'serviceUnreachableNotification')", () => {
				it("should change the text", () => {
					const parleyConfig = {runOptions: {interfaceTexts: {serviceUnreachableError: "Custom text"}}};
					const testMessage = `Test message ${Date.now()}`;

					cy.intercept("POST", "*/**/messages", {forceNetworkError: true});
					visitHome(parleyConfig);
					clickOnLauncher();
					sendMessage(testMessage);

					cy.get("@app")
						.find("[class^=parley-messaging-error__]")
						.should("have.text", parleyConfig.runOptions.interfaceTexts.serviceUnreachableError);

					// Test if it changes during runtime
					const newValue = "Custom text #2";
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.runOptions.interfaceTexts.serviceUnreachableError = newValue;
						});

					sendMessage(testMessage);

					cy.get("@app")
						.find("[class^=parley-messaging-error__]")
						.should("have.text", newValue);
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

				cy.get("[id=app]")
					.as("app");

				clickOnLauncher();

				cy.get("@app")
					.find("[class^=parley-messaging-text__]")
					.find("textarea")
					.should("have.attr", "placeholder", InterfaceTexts.english.inputPlaceholder);

				// Test if it changes during runtime
				cy.window()
					.then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.runOptions.country = "nl";
					});

				cy.get("@app")
					.find("[class^=parley-messaging-text__]")
					.find("textarea")
					.should("have.attr", "placeholder", InterfaceTexts.dutch.inputPlaceholder);

				// Extra test to validate that custom interface texts (desc we set above)
				// have not been overwritten by the new language's defaults
				cy.get("@app")
					.find("[class^=parley-messaging-title__]")
					.should("have.text", parleyConfig.runOptions.interfaceTexts.desc);
			});
		});
		describe("allowedMediaTypes", () => {
			it("should change the acceptable file types for the upload form", () => {
				const parleyConfig = {
					runOptions: {
						allowedMediaTypes: [
							"image/jpeg",
							"image/png",
							"image/gif",
						],
					},
				};

				visitHome(parleyConfig);

				cy.get("[id=app]")
					.as("app");

				clickOnLauncher();

				cy.get("@app")
					.find("[class^=parley-messaging-actions__]")
					.find("input")
					.should("have.attr", "accept", parleyConfig.runOptions.allowedMediaTypes.join(","));

				// Test if it changes during runtime
				const newAllowedMediaTypes = [
					"text/plain",
					"text/csv",
					"application/pdf",
					"application/msword",
				];
				cy.window()
					.then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.runOptions.allowedMediaTypes = newAllowedMediaTypes;
					});

				cy.get("@app")
					.find("[class^=parley-messaging-actions__]")
					.find("input")
					.should("have.attr", "accept", newAllowedMediaTypes.join(","));
			});
			it("should fallback to our supported file types if the array is empty", () => {
				const parleyConfig = {runOptions: {allowedMediaTypes: []}};

				visitHome(parleyConfig);

				cy.get("[id=app]")
					.as("app");

				clickOnLauncher();

				cy.get("@app")
					.find("[class^=parley-messaging-actions__]")
					.find("input")
					.should("have.attr", "accept", SUPPORTED_MEDIA_TYPES.join(","));
			});
			it("should fallback to our supported file types if the setting is not set", () => {
				const parleyConfig = {runOptions: {}};

				visitHome(parleyConfig);

				cy.get("[id=app]")
					.as("app");

				clickOnLauncher();

				cy.get("@app")
					.find("[class^=parley-messaging-actions__]")
					.find("input")
					.should("have.attr", "accept", SUPPORTED_MEDIA_TYPES.join(","));
			});
		});
		describe("allowFileUpload", () => {
			it(`should enable/disable the upload button`, () => {
				const parleyConfig = {runOptions: {allowFileUpload: false}};

				visitHome(parleyConfig);

				cy.get("[id=app]")
					.as("app");

				clickOnLauncher();

				cy.get("@app")
					.find("[class^=parley-messaging-actions__]")
					.find("input")
					.should("not.exist");
				cy.get("@app")
					.find("[class^=parley-messaging-uploadButton__]")
					.should("not.exist");

				// Test if it changes during runtime
				cy.window()
					.then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.runOptions.allowFileUpload = true;
					});

				cy.get("@app")
					.find("[class^=parley-messaging-actions__]")
					.find("input")
					.should("exist");
				cy.get("@app")
					.find("[class^=parley-messaging-uploadButton__]")
					.should("exist");
			});
		});
	});
	describe("roomNumber", () => {
		it("should register a new device when switching accounts", () => {
			const testMessage = `test message before switching room numbers ${Date.now()}`;

			visitHome();

			cy.get("[id=app]")
				.as("app");

			clickOnLauncher();
			sendMessage(testMessage);
			findMessage(testMessage); // Wait until the server received the new message

			// Test if it changes during runtime
			const newAccountIdentification = "1234";
			cy.intercept("POST", "*/**/devices", (req) => {
				expect(req.headers)
					.to
					.have
					.deep
					.property("x-iris-identification");
				expect(req.headers["x-iris-identification"])
					.to
					.match(new RegExp(`^${newAccountIdentification}:`, "u"));
			})
				.as("createDevice");

			cy.window()
				.then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.roomNumber = newAccountIdentification;
				});

			cy.wait("@createDevice");
		});
		it("should clear the messages when switching accounts", () => {
			const parleyConfig = {roomNumber: "0cce5bfcdbf07978b269"};
			const testMessage = `test message before switching room numbers ${Date.now()}`;

			visitHome(parleyConfig);

			cy.get("[id=app]")
				.as("app");

			clickOnLauncher();
			sendMessage(testMessage);
			findMessage(testMessage); // Wait until the server received the new message

			// Change the account identification
			const newAccountIdentification = "0W4qcE5aXoKq9OzvHxj2";
			cy.window()
				.then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.roomNumber = newAccountIdentification;
				});

			cy.get("@app")
				.find("[class^=parley-messaging-wrapper__]")
				.should("be.visible")
				.find("[class^=parley-messaging-body__]")
				.should("be.visible")
				.should("not.contain", testMessage);
		});
	});
	describe("xIrisIdentification", () => {
		it("should register a new device when switching identifications", () => {
			const parleyConfig = {xIrisIdentification: "aaaaaaaaaaaa"};
			const testMessage = `test message before switching udid ${Date.now()}`;

			visitHome(parleyConfig);

			cy.get("[id=app]")
				.as("app");

			clickOnLauncher();
			sendMessage(testMessage);
			findMessage(testMessage); // Wait until the server received the new message

			// Test if it changes during runtime
			const newUdid = "bbbbbbbbbbbb";
			cy.intercept("POST", "*/**/devices", (req) => {
				expect(req.headers)
					.to
					.have
					.deep
					.property("x-iris-identification");
				expect(req.headers["x-iris-identification"])
					.to
					.match(new RegExp(`^.*:${newUdid}`, "u"));
			})
				.as("createDevice");

			cy.window()
				.then((win) => {
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

			cy.get("[id=app]")
				.as("app");

			clickOnLauncher();
			sendMessage(testMessage);
			findMessage(testMessage); // Wait until the server received the new message

			// Test if it changes during runtime
			const newAuthHeader = "1234";
			cy.intercept("POST", "*/**/devices", (req) => {
				expect(req.headers)
					.to
					.have
					.deep
					.property("authorization", newAuthHeader);
			})
				.as("createDevice");

			cy.window()
				.then((win) => {
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

			cy.get("[id=app]")
				.as("app");

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
					.to
					.have
					.deep
					.property("userAdditionalInformation", newUserAdditionalInformation);
			})
				.as("createDevice");

			cy.window()
				.then((win) => {
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
			cy.get("[id=app]")
				.as("app");

			// creates the first device subscription call
			clickOnLauncher();

			// set the additional information
			cy.window()
				.then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.userAdditionalInformation = {"some-key": "some-value"};
				});

			// Retrieve the captured debug messages
			cy.window()
				.then((win) => {
					const capturedDebugMessages = win.__capturedDebugMessages;

					// we would only expect 1 device subscription call in total
					const actualCount = capturedDebugMessages.filter(msg => msg.includes(log)).length;
					expect(actualCount)
						.to
						.equal(1);
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

				cy.get("[id=app]")
					.as("app");

				// Launcher is not rendered because we are offline
				// and outside working hours
				cy.get("@app")
					.get("[class^=parley-messaging-launcher__]")
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

				cy.window()
					.then((win) => {
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

				cy.get("[id=app]")
					.as("app");

				// Launcher is not rendered because we are offline
				// and outside working hours
				cy.get("@app")
					.get("[class^=parley-messaging-launcher__]")
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

				cy.window()
					.then((win) => {
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

				visitHome(parleyConfig);

				cy.get("[id=app]")
					.as("app");

				// Launcher is not rendered because we are offline
				// and outside working hours
				cy.get("@app")
					.get("[class^=parley-messaging-launcher__]")
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

				cy.window()
					.then((win) => {
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

				cy.get("[id=app]")
					.as("app");

				// Launcher is not rendered because we are offline
				// and outside working hours
				cy.get("@app")
					.get("[class^=parley-messaging-launcher__]")
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

				cy.window()
					.then((win) => {
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

				cy.get("[id=app]")
					.as("app");

				// Launcher is not rendered because we are offline
				// and outside working hours
				cy.get("@app")
					.get("[class^=parley-messaging-launcher__]")
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

				cy.window()
					.then((win) => {
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

			cy.get("[id=app]")
				.as("app");

			// Make sure app exists
			cy.get("@app")
				.get("[class^=parley-messaging-launcher__]")
				.should("exist");

			cy.window()
				.then((win) => {
					expect(win.parleySettings.version)
						.to
						.equal(version);
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
			cy.window()
				.then((win) => {
					expect(win.parleySettings.apiCustomHeaders)
						.to
						.deep
						.equal(parleyConfig.apiCustomHeaders);
				});
		});
		it("should update the custom headers during runtime", () => {
			const parleyConfig = {apiCustomHeaders: {"x-custom-1": "1"}};
			const newCustomHeader = {"x-custom-3": "2"};

			visitHome(parleyConfig);

			cy.get("[id=app]")
				.as("app");

			cy.waitFor("@app");

			cy.window()
				.then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.apiCustomHeaders = newCustomHeader;
				});

			cy.intercept("POST", "*/**/devices")
				.as("postDevices");

			// We have to clear the local storage after the first registration
			// otherwise there won't be another POST /devices call because
			// the device information in the storage is the same as current
			cy.clearLocalStorage()
				.then(clickOnLauncher)
				.then(() => {
					return cy.wait("@postDevices")
						.then((interception) => {
							// Make sure both headers are used and not only the new one
							expect(interception.request.headers)
								.to
								.include(parleyConfig.apiCustomHeaders);
							expect(interception.request.headers)
								.to
								.include(newCustomHeader);
						});
				});
		});
		it("should not update the custom headers when the new header contains no differences", () => {
			const log = "[parley-web-library:DEBUG] Api custom headers changed, setting new custom headers";
			const parleyConfig = {apiCustomHeaders: {"X-CookiesOK": 1}};
			visitHome(parleyConfig);
			cy.get("[id=app]")
				.as("app");
			clickOnLauncher();

			cy.window()
				.then((win) => {
					// eslint-disable-next-line no-param-reassign
					win.parleySettings.apiCustomHeaders = {"X-CookiesOK": 1};
				});

			// Retrieve the captured debug messages
			cy.window()
				.then((win) => {
					const capturedDebugMessages = win.__capturedDebugMessages;

					// We would not expect an API custom header log since it already was set
					const actualCount = capturedDebugMessages.filter(msg => msg.includes(log)).length;
					expect(actualCount)
						.to
						.equal(0);
				});
		});
	});
	describe("devicePersistence", () => {
		beforeEach(() => {
			Cypress.Cookies.debug(true);
		});
		describe("domain", () => {
			it("should create a cookie, containing the deviceIdentification and with the devicePersistence.domain as domain, upon opening the chat", () => {
				const parleyConfig = {
					devicePersistence: {domain: "parley.nu"},
					xIrisIdentification: "12345678910",
				};

				cy.intercept("POST", "*/**/devices")
					.as("postDevices");
				cy.intercept("GET", messagesUrlRegex)
					.as("getMessages");

				visitHome(parleyConfig);

				clickOnLauncher();

				cy.wait("@postDevices")
					.then(() => {
						return cy.wait("@getMessages");
					})
					.then(() => {
						return cy.getCookies()
							.then(cookies => getCookiesFiltered(cookies))
							.then((cookies) => {
								expect(cookies)
									.to
									.have
									.length(1);

								expect(cookies[0])
									.to
									.have
									.property("name", `deviceIdentification`);
								expect(cookies[0])
									.to
									.have
									.property("domain", `.${parleyConfig.devicePersistence.domain}`);
								expect(cookies[0])
									.to
									.have
									.property("value", `${parleyConfig.xIrisIdentification}`);
							});
					});
			});
			it("should update the devicePersistence.domain during runtime", () => {
				const parleyConfig = {devicePersistence: {domain: "parley.nu"}};

				// We can only use valid subdomain(s) here, otherwise the cookie
				// will not be visible for the domain we are currently running
				// the chat on...
				const newPersistDeviceBetweenDomain = "chat-dev.parley.nu";

				visitHome(parleyConfig);

				cy.intercept("POST", "*/**/devices")
					.as("postDevices");
				cy.intercept("GET", messagesUrlRegex)
					.as("getMessages");

				clickOnLauncher();

				// Check if the cookie is set after registration
				cy.wait("@postDevices")
					.then(() => cy.wait("@getMessages"))
					.then(() => cy.getCookies())
					.then(cookies => getCookiesFiltered(cookies))
					.then((cookies) => {
						expect(cookies)
							.to.have.length(1);
						expect(cookies[0])
							.to
							.have
							.property("name", `deviceIdentification`);
						expect(cookies[0])
							.to
							.have
							.property("domain", `.${parleyConfig.devicePersistence.domain}`);
					})

					// Update the parleySettings and check if the cookie updated as well (after new registration)
					.then(cy.window)
					.then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.devicePersistence.domain = newPersistDeviceBetweenDomain;
					})
					.then(() => cy.wait("@postDevices"))
					.then(() => cy.wait("@getMessages"))
					.then(() => cy.getCookies())
					.then(cookies => getCookiesFiltered(cookies))
					.then((cookies) => {
						expect(cookies)
							.to.have.length(1);
						expect(cookies[0])
							.to
							.have
							.property("name", `deviceIdentification`);
						expect(cookies[0])
							.to
							.have
							.property("domain", `.${newPersistDeviceBetweenDomain}`);
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
					cy.wrap(deviceIdentification)
						.as("deviceIdentification");
				});

				it("should use the value, in the cookie, as it's initial device identification", () => {
					const parleyConfig = {devicePersistence: {domain: "parley.nu"}};

					visitHome(parleyConfig);

					cy.get("[id=app]")
						.as("app");
					cy.waitFor("@app");

					cy.intercept("GET", messagesUrlRegex)
						.as("getMessages");

					clickOnLauncher(); // Start the device registration

					// We know that if we start retrieving messages,
					// the device registration is completely finished
					// meaning that the cookie has been updated
					cy.wait("@getMessages")
						.then((interception) => {
							return cy.get("@deviceIdentification")
								.then((deviceIdentificationFromCookie) => {
									expect(interception.request.headers)
										.to
										.have
										.property("x-iris-identification", `${defaultParleyConfig.roomNumber}:${deviceIdentificationFromCookie}`);
								});
						});
				});
			});
		});
		describe("ageUpdateInterval", () => {
			it("should not start the interval if ageUpdateInterval is set but not ageUpdateIncrement", () => {
				const parleyConfig = {
					devicePersistence: {
						domain: "parley.nu",
						ageUpdateInterval: 10000, // in ms
					},
					xIrisIdentification: "12345678910",
				};

				cy.intercept("POST", "*/**/devices")
					.as("postDevices");
				cy.intercept("GET", messagesUrlRegex)
					.as("getMessages");

				visitHome(parleyConfig);

				clickOnLauncher();

				cy.wait("@postDevices")
					.then(() => {
						return cy.wait("@getMessages");
					});

				cy.getCookies()
					.then(cookies => getCookiesFiltered(cookies))
					.its(0)
					.its("expiry")
					.should("not.exist");

				cy.clock()
					.tick(parleyConfig.devicePersistence.ageUpdateInterval * 10); // Go 10 times the interval into the future

				cy.getCookies()
					.then(cookies => getCookiesFiltered(cookies))
					.its(0)
					.its("expiry")
					.should("not.exist"); // By default, our cookie has no expiry time, so we know the interval didn't run if the expiry still doesn't exist
			});
		});
		describe("ageUpdateIncrement", () => {
			it("should not start the interval if ageUpdateIncrement is set but not ageUpdateInterval", () => {
				const parleyConfig = {
					devicePersistence: {
						domain: "parley.nu",
						ageUpdateIncrement: 10, // in seconds
					},
					xIrisIdentification: "12345678910",
				};

				cy.intercept("POST", "*/**/devices")
					.as("postDevices");
				cy.intercept("GET", messagesUrlRegex)
					.as("getMessages");

				visitHome(parleyConfig);

				clickOnLauncher();

				cy.wait("@postDevices")
					.then(() => {
						return cy.wait("@getMessages");
					});

				cy.getCookies()
					.then(cookies => getCookiesFiltered(cookies))
					.its(0)
					.its("expiry")
					.should("not.exist");

				cy.clock()
					.tick(60 * 60); // Go into the future

				cy.getCookies()
					.then(cookies => getCookiesFiltered(cookies))
					.its(0)
					.its("expiry")
					.should("not.exist"); // By default, our cookie has no expiry time, so we know the interval didn't run if the expiry still doesn't exist
			});
		});
		describe("ageUpdateInterval + ageUpdateIncrement", () => {
			it("should start the interval according to ageUpdateInterval's value and increment the cookie's expiry time according to ageUpdateIncrement's value", () => {
				const parleyConfig = {
					devicePersistence: {
						domain: "parley.nu",
						ageUpdateInterval: 10000, // in ms
						ageUpdateIncrement: 10, // in seconds
					},
					xIrisIdentification: "12345678910",
				};

				const parleyConfig2 = {
					...parleyConfig,
					devicePersistence: {
						ageUpdateInterval: 1000,
						ageUpdateIncrement: 1,
					},
				};

				cy.intercept("POST", "*/**/devices")
					.as("postDevices");
				cy.intercept("GET", messagesUrlRegex)
					.as("getMessages");

				cy.clock(new Date().getTime()); // Start the clock override

				visitHome(parleyConfig, null, null);

				clickOnLauncher();

				cy.wait("@postDevices");
				cy.wait("@getMessages");

				cy.getCookies()
					.then(cookies => getCookiesFiltered(cookies))
					.its(0)
					.its("expiry")
					.should("exist")
					.as("oldExpiryTime");

				// Go X times the interval into the future
				const amountOfIntervalsToSkip = 10;
				const future = parleyConfig.devicePersistence.ageUpdateInterval * amountOfIntervalsToSkip; // in ms
				cy.tick(future);

				// When checking if the expiry time is correctly increased
				// we might miss a couple seconds due to the test running slow.
				// To combat this we use a margin around which the expiry time can be for it to be "valid"
				const matchMargin = 2; // In seconds

				cy.get("@oldExpiryTime")
					.then((oldExpiryTime) => {
						return cy.getCookies()
							.then(cookies => getCookiesFiltered(cookies))
							.its(0)
							.its("expiry")
							.should(
								"be.closeTo",
								oldExpiryTime
								+ (parleyConfig.devicePersistence.ageUpdateIncrement * amountOfIntervalsToSkip),
								matchMargin,
							);
					});

				// Change the settings during runtime and do the same checks
				cy.window()
					.then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.devicePersistence.ageUpdateInterval
							= parleyConfig2.devicePersistence.ageUpdateInterval;
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.devicePersistence.ageUpdateIncrement
							= parleyConfig2.devicePersistence.ageUpdateIncrement;
					});

				cy.getCookies()
					.then(cookies => getCookiesFiltered(cookies))
					.its(0)
					.its("expiry")
					.should("exist")
					.as("oldExpiryTime2");

				const amountOfIntervalsToSkip2 = 5;
				const future2 = parleyConfig2.devicePersistence.ageUpdateInterval * amountOfIntervalsToSkip2;
				cy.tick(future2);

				cy.get("@oldExpiryTime2")
					.then((oldExpiryTime2) => {
						return cy.getCookies()
							.then(cookies => getCookiesFiltered(cookies))
							.its(0)
							.its("expiry")
							.should(
								"be.closeTo",
								oldExpiryTime2
								+ (parleyConfig2.devicePersistence.ageUpdateIncrement * amountOfIntervalsToSkip2),
								matchMargin,
							);
					});
			});
			describe("subscribing using cookie", () => {
				it("should expire the cookie and the deviceIdentification should not be used anymore", () => {
					const parleyConfig = {
						devicePersistence: {
							domain: "parley.nu",
							ageUpdateInterval: 10000, // in ms
							ageUpdateIncrement: 10, // in seconds
						},
					};

					cy.intercept("POST", "*/**/devices")
						.as("postDevices");
					cy.intercept("GET", messagesUrlRegex)
						.as("getMessages");

					visitHome(parleyConfig, null, null, () => {
						cy.clock(new Date().getTime()); // Start the clock override

						// The clock override must be done after the accessibility test
						// otherwise it will crash the checkA11y()
					});

					clickOnLauncher();

					cy.wait("@postDevices");
					cy.wait("@getMessages");

					// region: Simulate opening the chat on a different domain.

					// We destroy the chat to stop the interval from updating the cookie (just like when the
					// browser window is closed)
					cy.window()
						.then((win) => {
							win.destroyParleyMessenger();
						});

					// Then we clear the storage so that device identification can not be used (just like
					// when you open the chat on a different domain)
					cy.clearAllLocalStorage();

					// endregion

					// Save the identification, so we can check if it is NOT used after it is expired
					cy.getCookies()
						.then(cookies => getCookiesFiltered(cookies))
						.its(0)
						.its("value")
						.as("cookieIdentificationValue");

					// Validate that we have successfully set the expiry time on the cookie
					cy.getCookies()
						.then(cookies => getCookiesFiltered(cookies))
						.its(0)
						.its("expiry")
						.should("be.greaterThan", 0);

					// Simulate the expiration of the cookie by deleting it.
					// Sadly there is no way in cypress to jump into the future
					// so that the browser can delete the cookie...
					// (cy.tick() doesn't work for this)
					cy.clearCookie("deviceIdentification");

					// The cookie expiry time should be extended, so now we can reload to page to
					// stop the interval from running
					const parleyConfigWithoutInterval = {
						...parleyConfig,
						devicePersistence: {
							ageUpdateInterval: 0,
							ageUpdateIncrement: 0,
						},
					};

					visitHome(parleyConfigWithoutInterval, null, null);

					// Start the subscribe call
					clickOnLauncher();

					// Intercept the subscribe call and make sure the identification used is different than the one
					// from the cookie
					cy.wait("@postDevices")
						.then((intercept) => {
							const header = intercept.request.headers["x-iris-identification"];
							const identification = header.split(":")[1];
							cy.get("@cookieIdentificationValue")
								.then((cookieIdentification) => {
									expect(identification)
										.to
										.not
										.equal(cookieIdentification);
								});
						});
				});
			});
		});
	});
	describe("interface", () => {
		describe("hideChatAfterBusinessHours", () => {
			it("should hide the chat after business hours", () => {
				const parleyConfig = {
					weekdays: [
						["Monday"],
						["Tuesday"],
						["Wednesday"],
						["Thursday"],
						["Friday"],
						["Saturday"],
						["Sunday"],
					],
					interface: {hideChatAfterBusinessHours: false},
				};

				visitHome(parleyConfig);

				cy.get("[id=app]")
					.as("app");

				// Launcher should appear because we
				// are inside working hours
				clickOnLauncher();

				// Test if it changes during runtime
				const newWeekdays = [ // closed every day
					["Monday"],
					["Tuesday"],
					["Wednesday"],
					["Thursday"],
					["Friday"],
					["Saturday"],
					["Sunday"],
				];

				cy.window()
					.then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.weekdays = newWeekdays;
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.interface.hideChatAfterBusinessHours = true;
					});

				// Launcher is not rendered because we are offline
				// and outside working hours
				cy.get("@app")
					.get("[class^=parley-messaging-launcher__]")
					.should("not.exist");
			});
		});
		describe("unreadMessagesAction", () => {
			beforeEach(() => {
				cy.window()
					.then((win) => {
						// These things are necessary for slow polling to start
						win.localStorage.setItem("messengerOpenState", "minimize");
						win.localStorage.setItem("deviceInformation", JSON.stringify({deviceIdentification: "aaaaaaaa-ac09-4ee5-8631-abf4d9f4885b"}));
					});

				// Intercept the get messages
				cy.fixture("getMessagesResponse.json")
					.then((fixture) => {
						const _fixture = fixture;
						_fixture.data = [
							{
								id: 1,
								time: 1536739259,
								message: "Message #1",
								image: null,
								typeId: 2,
								agent: {
									id: 2,
									name: "Tracebuzz",
									avatar: "https://beta.tracebuzz.com/images/avatars/1912991618/6033.jpg",
									isTyping: null,
								},
								carousel: [],
								quickReplies: [],
								custom: [],
								title: null,
								media: null,
								buttons: [],
								status: STATUS_AVAILABLE,
							}, {
								id: 2,
								time: 1536739265,
								message: "Message #2",
								image: null,
								typeId: 2,
								agent: {
									id: 2,
									name: "Tracebuzz",
									avatar: "https://beta.tracebuzz.com/images/avatars/1912991618/6033.jpg",
									isTyping: null,
								},
								carousel: [],
								quickReplies: [],
								custom: [],
								title: null,
								media: null,
								buttons: [],
								status: STATUS_AVAILABLE,
							},
						];
						cy.intercept("GET", messagesUrlRegex, _fixture)
							.as("getMessages");
					});

				cy.intercept("GET", "*/**/messages/unseen/count", {fixture: "getMessagesUnreadCountResponse.json"})
					.as("getUnseenMessagesCount");

				cy.intercept("PUT", "*/**/messages/status/*")
					.as("putMessageStatus");
			});

			describe("using value 0 (openChatWindow)", () => {
				it(`should show the chat when new agent messages are received, device has been registered before and previous state is minimized`, () => {
					cy.intercept("GET", messagesUrlRegex, cy.spy().as("getMessagesSpy"));

					// Intercept the count call indefinitely, because it will trigger
					// the chat window to open up. We first need to validate that there
					// are no GET messages calls while the chat is closed.
					const countInterception = interceptIndefinitely("GET", "*/**/messages/unseen/count", {fixture: "getMessagesUnreadCountResponse.json"});

					visitHome({interface: {unreadMessagesAction: 0}});
					cy.get("@app")
						.find("[class^=parley-messaging-launcher__]")
						.find("button")
						.should("be.visible");

					// Validate that there are no GET messages calls while the chat is closed.
					cy.get("@getMessagesSpy").should("not.have.been.called");
					cy.then(countInterception.sendResponse); // Use then() to schedule this AFTER the getMessagesSpy validation

					// Validate that the main chat window is visible
					// and that the unread messages badge counter doesn't show up
					cy.get("@app")
						.find("[class^=parley-messaging-chat__]")
						.should("be.visible");
					cy.get("@app")
						.find("[class^=parley-messaging-launcher__]")
						.find("[class^=parley-messaging-unreadMessagesBadge__]")
						.should("not.exist");

					// Validate that the message statuses have been updated
					cy.wait("@putMessageStatus");

					// From this point on the counter should return 0 since all messages
					// have been marked as read
					cy.fixture("getMessagesUnreadCountResponse.json")
						.then((fixture) => {
							const _fixture = fixture;
							_fixture.data = {
								messageIds: [],
								count: 0,
							};
							cy.intercept("GET", "*/**/messages/unseen/count", _fixture);
						});

					// Test that it changes during runtime
					cy.window()
						.then((win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings.interface.unreadMessagesAction = 1;
						});
					clickOnLauncher(); // Close the chat

					cy.intercept("GET", messagesUrlRegex, cy.spy().as("getMessagesSpy2"));
					cy.fixture("getMessagesUnreadCountResponse.json")
						.then((fixture) => {
							const _fixture = fixture;
							_fixture.data = {
								messageIds: [9999],
								count: 1,
							};
							cy.intercept("GET", "*/**/messages/unseen/count", _fixture)
								.as("getUnreadMessagesCount");
						});
					cy.wait("@getUnreadMessagesCount");

					cy.get("@app")
						.find("[class^=parley-messaging-launcher__]")
						.find("[class^=parley-messaging-unreadMessagesBadge__]")
						.should("have.text", 1)
						.should("be.visible");
					cy.get("@app")
						.find("[class^=parley-messaging-chat__]")
						.should("not.be.visible");
					cy.get("@getMessagesSpy2").should("not.have.been.called");
				});
			});
			describe("using value 1 (showMessageCounterBadge)", () => {
				it("should show an unread messages counter when new agent messages are received while the chat is closed and device has been registered before and previous state is minimized", () => {
					cy.intercept("GET", messagesUrlRegex, cy.spy().as("getMessagesSpy"));

					// Make sure to set the correct unread message action
					// otherwise the counter won't show up
					const config = {interface: {unreadMessagesAction: 1}};
					visitHome(config);

					cy.get("@app")
						.find("[class^=parley-messaging-launcher__]")
						.find("button")
						.should("be.visible");

					cy.wait("@getUnseenMessagesCount");

					// Validate that the unread messages badge counter shows up
					// and shows the correct number
					// and that the main chat window is not visible
					cy.get("@app")
						.find("[class^=parley-messaging-launcher__]")
						.find("[class^=parley-messaging-unreadMessagesBadge__]")
						.should("have.text", 2)
						.should("be.visible");
					cy.get("@app")
						.find("[class^=parley-messaging-chat__]")
						.should("not.be.visible");

					// Validate that it keeps showing up even after a refresh of the page
					visitHome(config);
					cy.get("@getMessagesSpy").should("not.have.been.called");
					cy.get("@app")
						.find("[class^=parley-messaging-launcher__]")
						.find("[class^=parley-messaging-unreadMessagesBadge__]")
						.should("have.text", 2)
						.should("be.visible");
					cy.get("@app")
						.find("[class^=parley-messaging-chat__]")
						.should("not.be.visible");

					// Update the interception for unseen messages count, because the app should mark
					// the messages as seen in the api when showing the conversation
					cy.fixture("getMessagesUnreadCountResponse.json")
						.then((fixture) => {
							const _fixture = fixture;
							_fixture.data = {
								messageIds: [],
								count: 0,
							};
							cy.intercept("GET", "*/**/messages/unseen/count", _fixture);
						});

					clickOnLauncher();

					cy.wait("@getMessages");
					cy.wait("@putMessageStatus");

					// Validate that the unread messages badge counter hides
					// when opening the main screen
					cy.get("@app")
						.find("[class^=parley-messaging-launcher__]")
						.find("[class^=parley-messaging-unreadMessagesBadge__]")
						.should("not.exist");
					cy.get("@app")
						.find("[class^=parley-messaging-chat__]")
						.should("be.visible");
				});
			});
		});
		describe("alwaysShowSendButton", () => {
			it("should show the send button when enabled", () => {
				const parleyConfig = {interface: {alwaysShowSendButton: true}};
				const testMessage = "Only Chuck Norris can cause a Sonic Boom.";
				visitHome(parleyConfig);
				clickOnLauncher();

				// Type some text to trigger the submit button visibility
				cy.get("@app")
					.find("[class^=parley-messaging-chat__]")
					.should("be.visible")
					.find("[class^=parley-messaging-footer__]")
					.should("be.visible")
					.find("[class^=parley-messaging-text__]")
					.should("be.visible")
					.find("textarea")
					.should("have.focus")
					.type(`${testMessage}`);

				cy.get("@app")
					.find("#submitButton")
					.should("be.visible");

				// Make sure it changes during runtime
				cy.window()
					.then((win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings.interface.alwaysShowSendButton = false;
					});

				cy.get("@app")
					.find("#submitButton")
					.should("not.exist");
			});
		});
	});
});
