/* eslint-disable @babel/no-invalid-this */
import {InterfaceTexts} from "../../src/UI/Scripts/Context";
import {version} from "../../package.json";
import {generateParleyMessages, interceptIndefinitely} from "../support/utils";
import {SUPPORTED_MEDIA_TYPES} from "../../src/Api/Constants/SupportedMediaTypes";
import {STATUS_AVAILABLE} from "../../src/Api/Constants/Statuses";

const defaultParleyConfig = {roomNumber: "0cce5bfcdbf07978b269"};
const messagesUrlRegex = /.*\/messages(?:\/(?:after|before):\d+)?(?!\/)/u; // This matches /messages and /messages/after:123

function visitHome(parleyConfig, onBeforeLoad, onLoad) {
	cy.visit("/", {
		onBeforeLoad: (window) => {
			// eslint-disable-next-line no-param-reassign
			window.parleySettings = {
				...defaultParleyConfig, // Always set default config
				...parleyConfig,
			};
			if(onBeforeLoad)
				onBeforeLoad(window);
		},
		onLoad: (window) => {
			if(onLoad)
				onLoad(window);

			window.initParleyMessenger();
		},
	});
	cy.get("[id=app]")
		.as("app");
}

function clickOnLauncher() {
	return cy.get("@app")
		.find("[class^=parley-messaging-launcher__]")
		.find("button")
		.should("be.visible")
		.click();
}

function sendMessage(testMessage) {
	return cy.get("@app")
		.find("[class^=parley-messaging-chat__]")
		.should("be.visible")
		.find("[class^=parley-messaging-footer__]")
		.should("be.visible")
		.find("[class^=parley-messaging-text__]")
		.should("be.visible")
		.find("textarea")
		.should("have.focus")
		.type(`${testMessage}{enter}`);
}

function findMessage(testMessage) {
	return cy.get("@app")
		.find("[class^=parley-messaging-wrapper__]")
		.should("be.visible")
		.find("[class^=parley-messaging-body__]")
		.should("be.visible")
		.contains(testMessage)
		.should("be.visible");
}

function pretendToBeMobile(window) {
	// Mock match media to return true
	Object.defineProperty(window, "matchMedia", {value: arg => ({matches: Boolean(arg.includes("(pointer: coarse)"))})});
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
		[
			true, false,
		].forEach((loggedIn) => {
			it(`should send a new message, as a ${loggedIn ? "logged in" : "anonymous"} user, with the new message showing up in the conversation`, () => {
				const testMessage = `Test message ${Date.now()}`;

				let authHeader;
				if(loggedIn)
					authHeader = Cypress.env("authorizationHeader");


				cy.intercept("POST", "/**/messages")
					.as("postMessage");

				visitHome({authHeader});
				clickOnLauncher();
				sendMessage(testMessage);

				// Make sure the authorization is set correctly on the POST /message call
				cy.wait("@postMessage")
					.then((interception) => {
						if(loggedIn) {
							expect(interception.request.headers)
								.to
								.have
								.property("authorization", authHeader);
						} else {
							expect(interception.request.headers)
								.to
								.have
								.property("authorization", "");
						}
					});

				// Check to see if the message is rendered correctly
				findMessage(testMessage);
			});
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
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-error__]")
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
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-error__]")
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
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-error__]")
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
			})
				.as("postDevices");

			visitHome();
			clickOnLauncher();

			// Validate that api error is visible
			cy.get("@app")
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-error__]")
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
			});

			visitHome();
			clickOnLauncher();

			// Validate that api error is visible
			cy.get("@app")
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-error__]")
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
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-error__]")
				.should("be.visible")
				.should("have.text", "Something went wrong while sending your message, please try again later");

			cy.intercept("POST", "*/**/messages"); // Remove handler

			// Click the error close button
			cy.get("@app")
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-error__]")
				.should("be.visible")
				.find("[class^=parley-messaging-closeButton__]")
				.should("be.visible")
				.click();

			// Validate that the error disappeared
			cy.get("@app")
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-error__]")
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
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-footer__]")
				.should("be.visible")
				.find("[class^=parley-messaging-text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.disabled")
				.then(interception.sendResponse);

			findMessage(testMessage);

			// Validate that the textarea is enabled
			cy.get("@app")
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-footer__]")
				.should("be.visible")
				.find("[class^=parley-messaging-text__]")
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
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-footer__]")
				.should("be.visible")
				.find("[class^=parley-messaging-text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.disabled")
				.then(interception.sendResponse);

			// Validate that the text area is enabled
			cy.get("@app")
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-footer__]")
				.should("be.visible")
				.find("[class^=parley-messaging-text__]")
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
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-footer__]")
				.should("be.visible")
				.find("[class^=parley-messaging-text__]")
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
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-footer__]")
				.should("be.visible")
				.find("[class^=parley-messaging-text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.disabled")
				.then(interception.sendResponse);

			findMessage(testMessage);

			// Validate that the textarea is enabled
			cy.get("@app")
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-footer__]")
				.should("be.visible")
				.find("[class^=parley-messaging-text__]")
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
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-footer__]")
				.should("be.visible")
				.find("[class^=parley-messaging-text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.disabled");

			clickOnLauncher(); // Hide chat
			clickOnLauncher(); // Show chat

			// Validate that the text area is still disabled
			// and then continue the subscribe call
			cy.get("@app")
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-footer__]")
				.should("be.visible")
				.find("[class^=parley-messaging-text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.disabled")
				.then(interception.sendResponse);

			findMessage(testMessage);

			// Validate that the textarea is enabled
			cy.get("@app")
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-footer__]")
				.should("be.visible")
				.find("[class^=parley-messaging-text__]")
				.should("be.visible")
				.find("textarea")
				.should("be.visible")
				.should("be.enabled");
		});
		it("should re-register after receiving the `deviceRequiresAuthorizationError` error and close the error", () => {
			const parleyConfig = {xIrisIdentification: "aaaaaaaaaaaa"};
			const testMessage = `Test message ${Date.now()}`;

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
				.should("have.text", "This conversation is continued in a logged-in environment, go back to that environment if you want to continue the conversation. Send a new message below if you want to start a new conversation.");
			cy.intercept("GET", messagesUrlRegex, req => req.continue()); // Reset the previous interceptor

			// Test that the identification changed and does not match the old identification anymore
			cy.intercept("POST", "*/**/devices", (req) => {
				expect(req.headers)
					.to
					.have
					.deep
					.property("x-iris-identification");
				expect(req.headers["x-iris-identification"])
					.to
					.not
					.match(new RegExp(`^.*:${parleyConfig.xIrisIdentification}`, "u"));
			})
				.as("createDevice");

			sendMessage(testMessage);
			cy.wait("@createDevice");
			findMessage(testMessage);

			cy.get("@error")
				.should("not.exist");
		});
		describe("upload media", () => {
			[
				{
					fileName: "pdf.pdf",
					expectedIcon: "file-pdf",
				},
				{
					fileName: "plain.txt",
					expectedIcon: "file-lines",
				},
				{
					fileName: "excel.xlsx",
					expectedIcon: "file-excel",
				},
				{
					fileName: "word.doc",
					expectedIcon: "file-word",
				},
				{
					fileName: "word.docx",
					expectedIcon: "file-word",
				},
				{
					fileName: "powerpoint.pptx",
					expectedIcon: "file-powerpoint",
				},

				// {
				// 	fileName: "powerpoint.ppt",
				// 	expectedIcon: "file-powerpoint",
				// },
				// There are problems with .ppt files in the newest clientApi v1.8 update
				// so they are disabled for now. Tracked in https://github.com/parley-messaging/client-api/issues/269
				// {
				// 	fileName: "audio.mp3",
				// 	expectedIcon: "file-audio",
				// },
				// There are problems with .mp3 files in the newest clientApi v1.8 update
				// so they are disabled for now. Tracked in https://github.com/parley-messaging/client-api/issues/269

				{
					fileName: "video.mp4",
					expectedIcon: "file-video",
				},

				// I did not find a way to create a file with `application/msexcel` so this one will not be tested
			].forEach(({
				fileName,
				expectedIcon,
			}) => {
				it(`should show the media file '${fileName}', after submitting it`, () => {
					cy.intercept("POST", "*/**/messages")
						.as("postMessage");
					cy.intercept("GET", messagesUrlRegex)
						.as("getMessages");

					cy.fixture(fileName, null) // The `null` encoding is very important, otherwise some files wont work
						.as("mediaFile");

					visitHome();

					clickOnLauncher();

					cy.get("#upload-file")
						.selectFile("@mediaFile", {force: true}); // We need to force it because this input is hidden

					cy.wait("@postMessage");
					cy.wait("@getMessages");

					cy.get("div[class^=parley-messaging-messageBoxMedia__]")
						.should("have.text", fileName)
						.find("svg")
						.first()
						.invoke("attr", "data-icon")
						.should("eq", expectedIcon);
					cy.get("div[class^=parley-messaging-messageBoxMedia__]")
						.find("button[class^=parley-messaging-messageBoxMediaDownload__]")
						.should("be.visible");
				});
			});
			it("should show the `uploadMediaInvalidTypeError` error when we upload an invalid media file", () => {
				// We don't really need to upload anything,
				// we just check if the error is shown when we receive it from the api
				cy.intercept("POST", "*/**/media", {
					body: {
						notifications: [
							{
								type: "error",
								message: "invalid_media_type",
							},
						],
						status: "ERROR",
						metadata: {
							values: null,
							method: "post",
							duration: 0.01,
						},
					},
				})
					.as("postMedia");

				cy.fixture("pdf.pdf", null)
					.as("mediaFile");

				visitHome();
				clickOnLauncher();

				cy.get("#upload-file")
					.selectFile("@mediaFile", {force: true}); // We need to force it because this input is hidden

				cy.wait("@postMedia");

				cy.get("div[class^=parley-messaging-error__]")
					.should("have.text", "You can not upload this type of file");
			});
			it("should show the `uploadMediaTooLargeError` error when we upload a media file that is larger than 10mb", () => {
				// We don't really need to upload anything,
				// we just check if the error is shown when we receive it from the api
				cy.intercept("POST", "*/**/media", {
					body: {
						notifications: [
							{
								type: "error",
								message: "media_too_large",
							},
						],
						status: "ERROR",
						metadata: {
							values: null,
							method: "post",
							duration: 0.01,
						},
					},
				})
					.as("postMedia");

				cy.fixture("pdf.pdf", null)
					.as("mediaFile");

				visitHome();
				clickOnLauncher();

				cy.get("#upload-file")
					.selectFile("@mediaFile", {force: true}); // We need to force it because this input is hidden

				cy.wait("@postMedia");

				cy.get("div[class^=parley-messaging-error__]")
					.should("have.text", "You can not upload files with sizes that exceed the 10mb limit");
			});
			it("should show the `uploadMediaNotUploadedError` error when we uploading goes wrong", () => {
				// We don't really need to upload anything,
				// we just check if the error is shown when we receive it from the api
				cy.intercept("POST", "*/**/media", {
					body: {
						notifications: [
							{
								type: "error",
								message: "media_not_uploaded",
							},
						],
						status: "ERROR",
						metadata: {
							values: null,
							method: "post",
							duration: 0.01,
						},
					},
				})
					.as("postMedia");

				cy.fixture("pdf.pdf", null)
					.as("mediaFile");

				visitHome();
				clickOnLauncher();

				cy.get("#upload-file")
					.selectFile("@mediaFile", {force: true}); // We need to force it because this input is hidden

				cy.wait("@postMedia");

				cy.get("div[class^=parley-messaging-error__]")
					.should("have.text", "Something went wrong while uploading this file, please try again later");
			});
		});
		it("should hide the media upload button when the submit button should be shown", () => {
			visitHome({}, null, pretendToBeMobile);
			clickOnLauncher();

			cy.get("label[class^=parley-messaging-uploadLabel__]")
				.should("exist");

			cy.get("@app")
				.find("[class^=parley-messaging-chat__]")
				.find("[class^=parley-messaging-footer__]")
				.find("[class^=parley-messaging-text__]")
				.find("textarea")
				.type(`This is some text`);

			cy.get("label[class^=parley-messaging-uploadLabel__]")
				.should("not.exist");
			cy.get("button[class^=parley-messaging-mobile__]")
				.should("exist");
		});
	});
	describe("receiving messages", () => {
		describe("agent names", () => {
			it("should show the same agent name only once when multiple consecutive messages are from the same agent", () => {
				visitHome();

				// Intercept GET messages and return a fixture message with one agent in it
				cy.intercept("GET", messagesUrlRegex, {fixture: "getMessagesWithOneAgent.json"});

				clickOnLauncher();

				cy.get("@app")
					.find("[class^=parley-messaging-name__]")
					.should("exist")
					.should("have.length", 1);
			});
			it("should show the new agent name when it changed between agent messages", () => {
				visitHome();

				// Intercept GET messages and return a fixture message with multiple agents in it
				cy.intercept("GET", messagesUrlRegex, {fixture: "getMessagesWithMultipleAgents.json"});

				clickOnLauncher();

				cy.get("@app")
					.find("[class^=parley-messaging-name__]")
					.should("exist")
					.should("have.length", 2);
			});
		});
		it("should render images when received", () => {
			visitHome();

			// Intercept GET messages and return a fixture message with an image in it
			cy.intercept("GET", messagesUrlRegex, {fixture: "getMessageWithImageResponse.json"});

			// Intercept the request for the image binary
			cy.intercept("GET", "*/**/media/**/*", {fixture: "image.png"});

			clickOnLauncher();

			cy.get("@app")
				.find("[class^=parley-messaging-message__]")
				.should("have.length", 2)
				.find("input[type=image]")
				.should("have.length", 2)
				.should("exist");
		});
		it("should render an error message when the image cannot be loaded", () => {
			visitHome();

			// Intercept GET messages and return a fixture message with an image in it
			cy.intercept("GET", messagesUrlRegex, {fixture: "getMessageWithImageResponse.json"})
				.as("getMessages");

			// Don't intercept GET /media and let the API give use the error we want

			clickOnLauncher();

			cy.wait("@getMessages");

			cy.get("@app")
				.find("[class^=parley-messaging-message__]")
				.first()
				.should("be.visible")
				.find("p")
				.should("have.text", "Unable to load media");
		});
		it("should show the `deviceRequiresAuthorizationError` error when we receive the `device_requires_authorization` api error", () => {
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

			visitHome();
			clickOnLauncher();

			// Validate that api error is visible
			cy.get("@app")
				.find("[class^=parley-messaging-chat__]")
				.should("be.visible")
				.find("[class^=parley-messaging-error__]")
				.should("be.visible")
				.should("have.text", "This conversation is continued in a logged-in environment, go back to that environment if you want to continue the conversation. Send a new message below if you want to start a new conversation.");
		});
		describe("message buttons", () => {
			it("should render buttons when received", () => {
				visitHome();

				// Intercept GET messages and return a fixture message with buttons in it
				cy.fixture("getMessageWithButtonsResponse.json")
					.as("getMessageWithButtonsResponseFixture");
				cy.get("@getMessageWithButtonsResponseFixture")
					.then((fixture) => {
						cy.intercept("GET", messagesUrlRegex, (req) => {
							req.reply(fixture);
						});
					});

				clickOnLauncher();

				// Check that every button rendered correctly
				cy.get("@getMessageWithButtonsResponseFixture")
					.then((fixture) => {
						fixture.data.forEach((message, messageIndex) => {
							message.buttons.forEach((button, buttonIndex) => {
								cy.get("@app")
									.find("[class^=parley-messaging-messageBubble__]")
									.its(messageIndex + 1) // +1 to skip the date "message"
									.find("[class^=parley-messaging-button__]")
									.its(buttonIndex)
									.should("have.text", button.title);
							});
						});
					});
			});
			it("should show the payload as the button title if no title is supplied", () => {
				visitHome();

				// Intercept GET messages and return a fixture message with buttons in it
				cy.fixture("getMessageWithButtonsResponse.json")
					.as("getMessageWithButtonsResponseFixture");
				cy.get("@getMessageWithButtonsResponseFixture")
					.then((fixture) => {
						const fixtureWithoutTitles = fixture;
						fixtureWithoutTitles.data = fixtureWithoutTitles.data.map((message) => {
							const updatedMessage = message;
							updatedMessage.buttons.map((button) => {
								const updatedButton = button;
								updatedButton.title = "";
								return updatedButton;
							});
							return updatedMessage;
						});
						cy.intercept("GET", messagesUrlRegex, (req) => {
							req.reply(fixtureWithoutTitles);
						})
							.as("getMessages");
					});

				clickOnLauncher();

				cy.wait("@getMessages");

				// Check that every button rendered correctly
				cy.get("@getMessageWithButtonsResponseFixture")
					.then((fixture) => {
						fixture.data.forEach((message, messageIndex) => {
							message.buttons.forEach((button, buttonIndex) => {
								cy.get("@app")
									.find("[class^=parley-messaging-messageBubble__]")
									.its(messageIndex + 1) // +1 to skip the date "message"
									.find("[class^=parley-messaging-button__]")
									.its(buttonIndex)
									.should("have.text", button.payload);
							});
						});
					});
			});
			it("should open a new page when clicking on the WebUrl button", () => {
				visitHome({}, (window) => {
					cy.stub(window, "open")
						.returns({
							// Window.open returns an object on which we call focus.
							// If we don't mock the focus() method the chat would throw an error
							// eslint-disable-next-line no-empty-function
							focus: () => {
							},
						}); // Mock window.open function
				});

				// Intercept GET messages and return a fixture message with buttons in it
				cy.fixture("getMessageWithButtonsResponse.json")
					.as("getMessageWithButtonFixture");

				cy.get("@getMessageWithButtonFixture")
					.then((fixture) => {
						cy.intercept("GET", messagesUrlRegex, (req) => {
							req.reply(fixture);
						});
					});

				clickOnLauncher();

				cy.get("@app")
					.find("[class^=parley-messaging-messageBubble__]")
					.find("button[name='WebUrlButton']")
					.first()
					.click();

				cy.get("@getMessageWithButtonFixture")
					.then((fixture) => {
						cy.window()
							.its("open")
							.should("be.calledWith", fixture.data[0].buttons[0].payload, "_blank", "noopener,noreferrer");
					});
			});
			it("should open the phone app in the current page when clicking on the Call button", () => {
				visitHome({}, (window) => {
					cy.stub(window, "open")
						.as("windowOpen"); // Mock window.open function
				});

				// Intercept GET messages and return a fixture message with buttons in it
				cy.fixture("getMessageWithButtonsResponse.json")
					.as("getMessageWithButtonFixture");

				cy.get("@getMessageWithButtonFixture")
					.then((fixture) => {
						cy.intercept("GET", messagesUrlRegex, (req) => {
							req.reply(fixture);
						});
					});

				clickOnLauncher();

				cy.get("@app")
					.find("[class^=parley-messaging-messageBubble__]")
					.find("button[name='CallButton']")
					.first()
					.click();

				cy.get("@getMessageWithButtonFixture")
					.then((fixture) => {
						cy.get("@windowOpen")
							.should("be.calledWith", fixture.data[0].buttons[1].payload, "_self", "noopener,noreferrer");
					});
			});
			it("should set the input field text when clicking on the Reply button", () => {
				visitHome();

				// Intercept GET messages and return a fixture message with buttons in it
				cy.fixture("getMessageWithButtonsResponse.json")
					.as("getMessageWithButtonFixture");

				cy.get("@getMessageWithButtonFixture")
					.then((fixture) => {
						cy.intercept("GET", messagesUrlRegex, (req) => {
							req.reply(fixture);
						});
					});

				// Intercept the POST that happens when you click the button.
				// We use a small delay because we need to check if the button
				// disables itself after you clicked it
				// (and re-enables itself after the POST is done)
				cy.intercept("POST", "*/**/messages", (req) => {
					req.on("response", (res) => {
						res.setDelay(500);
					});
				})
					.as("postMessage");

				clickOnLauncher();

				cy.get("@app")
					.find("[class^=parley-messaging-messageBubble__]")
					.find("button[name='ReplyButton']")
					.first()
					.as("clickedButton");

				cy.get("@clickedButton")
					.click()
					.should("be.disabled");

				cy.wait("@postMessage");

				cy.get("@clickedButton")
					.should("be.enabled");

				// Disable the interception, so we can send the message from the reply button
				// and also receive it.
				cy.intercept("GET", messagesUrlRegex, (req) => {
					req.continue();
				});

				// Trigger a GET call by clicking on the textarea
				// (otherwise we have to wait until the next polling interval)
				cy.get("div[class^=parley-messaging-footer__]")
					.find("textarea")
					.click();

				cy.get("@getMessageWithButtonFixture")
					.then((fixture) => {
						// Check to see if the message is rendered correctly
						findMessage(fixture.data[0].buttons[2].payload);
					});
			});
		});
		it("should show an error, after rendering an unsupported media file", () => {
			cy.intercept("GET", messagesUrlRegex, {fixture: "unsupportedMediaInMessage.json"})
				.as("getMessages");

			visitHome();

			clickOnLauncher();

			cy.wait("@getMessages");

			cy.get("article[class^=parley-messaging-message__]")
				.children()
				.first()
				.should("have.text", "Unsupported media")
				.find("button[class^=parley-messaging-messageBoxMediaDownload__]")
				.should("not.exist");
		});
		[
			{
				fileName: "pdf.pdf",
				fileExtension: "pdf",
				mimeType: "application/pdf",
				expectedIcon: "file-pdf",
			},
			{
				fileName: "plain.txt",
				fileExtension: "txt",
				mimeType: "text/plain",
				expectedIcon: "file-lines",
			},
			{
				fileName: "excel.xlsx",
				fileExtension: "xlsx",
				mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				expectedIcon: "file-excel",
			},
			{
				fileName: "word.doc",
				fileExtension: "doc",
				mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				expectedIcon: "file-word",
			},
			{
				fileName: "word.docx",
				fileExtension: "docx",
				mimeType: "application/msword",
				expectedIcon: "file-word",
			},
			{
				fileName: "powerpoint.pptx",
				fileExtension: "pptx",
				mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
				expectedIcon: "file-powerpoint",
			},
			{
				fileName: "powerpoint.ppt",
				fileExtension: "ppt",
				mimeType: "application/vnd.ms-powerpoint",
				expectedIcon: "file-powerpoint",
			},
			{
				fileName: "audio.mp3",
				fileExtension: "mp3",
				mimeType: "audio/mpeg",
				expectedIcon: "file-audio",
			},
			{
				fileName: "video.mp4",
				fileExtension: "mp4",
				mimeType: "video/mp4",
				expectedIcon: "file-video",
			},
		].forEach(({
			fileName,
			fileExtension,
			mimeType,
			expectedIcon,
		}) => {
			it(`should show the media file with mimeType '${mimeType}', after receiving it`, () => {
				cy.fixture("getMessageWithPdfResponse.json")
					.then((fixture) => {
						const _fixture = fixture;
						_fixture.data[0].media.id = fixture.data[0].media.id.replace(".pdf", `.${fileExtension}`);
						_fixture.data[0].media.filename = fixture.data[0].media.filename.replace(".pdf", `.${fileExtension}`);
						_fixture.data[0].media.description = fileName;
						_fixture.data[0].media.mimeType = mimeType;
						return _fixture;
					})
					.then(fixture => cy.intercept("GET", messagesUrlRegex, {body: fixture})
						.as("getMessages"));

				visitHome();

				clickOnLauncher();

				cy.wait("@getMessages");

				cy.get("div[class^=parley-messaging-messageBoxMedia__]")
					.should("have.text", fileName)
					.find("svg")
					.first()
					.invoke("attr", "data-icon")
					.should("eq", expectedIcon);
				cy.get("div[class^=parley-messaging-messageBoxMedia__]")
					.find("button[class^=parley-messaging-messageBoxMediaDownload__]")
					.should("be.visible");
			});
		});
		it(`should show the media file's filename, if description is not set, after receiving it`, () => {
			const fileName = "some-pdf.pdf";

			cy.fixture("getMessageWithPdfResponse.json")
				.then((fixture) => {
					const _fixture = fixture;
					_fixture.data[0].media.filename = fileName;
					_fixture.data[0].media.description = null;
					return _fixture;
				})
				.then(fixture => cy.intercept("GET", messagesUrlRegex, {body: fixture})
					.as("getMessages"));

			cy.intercept("GET", "*/**/media/**", {fixture: "pdf.pdf"})
				.as("getMedia");

			visitHome();

			clickOnLauncher();

			cy.wait("@getMessages");

			cy.get("div[class^=parley-messaging-messageBoxMedia__]")
				.should("have.text", fileName);
		});
		describe("carousel", () => {
			it("should show carousel with multiple items and can navigate using buttons or scrolling", () => {
				visitHome();

				cy.fixture("getMessageWithCarouselTextItems.json")
					.as("getMessageResponse");

				// Intercept GET messages and return a fixture message with an image in it
				cy.get("@getMessageResponse")
					.then((fixture) => {
						cy.intercept("GET", messagesUrlRegex, (req) => {
							req.reply(fixture);
						});
					});

				clickOnLauncher();

				cy.get("@getMessageResponse")
					.then((fixture) => {
						cy.get("@app")
							.find("[class^=parley-messaging-carouselContainer__]")
							.should("have.length", 1)
							.find("[class^=parley-messaging-messageBubble__]")
							.should("have.length", 2)
							.find("[class^=parley-messaging-message__]")
							.as("messages");
						cy.get("@messages")
							.eq(0)
							.find("p")
							.should("have.text", fixture.data[0].carousel[0].message)
							.should("be.visible");
						cy.get("@messages")
							.eq(1)
							.find("p")
							.should("have.text", fixture.data[0].carousel[1].message)
							.should("not.be.visible");
					});

				// Test navigation
				cy.get("[class^=parley-messaging-navButton__]")
					.should("not.be.visible");
				cy.get("[class^=parley-messaging-carouselContainer__]")
					.realHover({});
				cy.get("[class^=parley-messaging-navButton__]")
					.should("be.visible");

				// Next button click
				cy.get("button[name=next]")
					.click();
				cy.get("@messages")
					.eq(0)
					.should("not.be.visible");
				cy.get("@messages")
					.eq(1)
					.should("be.visible");

				// Previous button click
				cy.get("button[name=previous]")
					.click();
				cy.get("@messages")
					.eq(0)
					.should("be.visible");
				cy.get("@messages")
					.eq(1)
					.should("not.be.visible");

				// Mouse horizontal scroll right
				cy.get("[class^=parley-messaging-carouselContainer__]")
					.realMouseWheel({deltaX: 500});
				cy.get("@messages")
					.eq(0)
					.should("not.be.visible");
				cy.get("@messages")
					.eq(1)
					.should("be.visible");

				// Mouse horizontal scroll left
				cy.get("[class^=parley-messaging-carouselContainer__]")
					.realMouseWheel({deltaX: -500});
				cy.get("@messages")
					.eq(0)
					.should("be.visible");
				cy.get("@messages")
					.eq(1)
					.should("not.be.visible");

				// Stop hovering navigation
				cy.get("body")
					.realHover({});
				cy.get("[class^=parley-messaging-navButton__]")
					.should("not.be.visible");
			});
			it("should show carousel with multiple items and can navigate using swipe on mobile", () => {
				// According to https://gs.statcounter.com/screen-resolution-stats/mobile/worldwide
				// the most populair mobile screen size is 360x800,
				// so we'll use that for this test
				cy.viewport(360, 800);
				visitHome({}, null, pretendToBeMobile);

				cy.fixture("getMessageWithCarouselTextItems.json")
					.as("getMessageResponse");

				// Intercept GET messages and return a fixture message with an image in it
				cy.get("@getMessageResponse")
					.then((fixture) => {
						cy.intercept("GET", messagesUrlRegex, (req) => {
							req.reply(fixture);
						});
					});

				clickOnLauncher();

				cy.get("@app")
					.find("[class^=parley-messaging-message__]")
					.as("messages");

				// Test navigation (should always be visible on mobile)
				cy.get("[class^=parley-messaging-navButton__]")
					.should("be.visible");

				// Next button touch
				cy.get("button[name=next]")
					.realTouch({});
				cy.get("@messages")
					.eq(0)
					.should("not.be.visible");
				cy.get("@messages")
					.eq(1)
					.should("be.visible");

				// Previous button touch
				cy.get("button[name=previous]")
					.realTouch({});
				cy.get("@messages")
					.eq(0)
					.should("be.visible");
				cy.get("@messages")
					.eq(1)
					.should("not.be.visible");

				// Swipe right
				cy.get("[class^=parley-messaging-carouselContainer__]")
					.realSwipe("toLeft", {length: 100});
				cy.get("@messages")
					.eq(0)
					.should("not.be.visible");
				cy.get("@messages")
					.eq(1)
					.should("be.visible");

				// Swipe left
				cy.get("[class^=parley-messaging-carouselContainer__]")
					.realSwipe("toRight", {length: 100});
				cy.get("@messages")
					.eq(0)
					.should("be.visible");
				cy.get("@messages")
					.eq(1)
					.should("not.be.visible");
			});
			[
				{
					title: "fullscreen (mobile)",
					params: {
						mobile: true,
						carouselItems: 2,
					},
				},
				{
					title: "only 1 carousel item on non-fullscreen",
					params: {
						mobile: false,
						carouselItems: 1,
					},
				},
			].forEach((test) => {
				it(`should show carousel and hide navigation if all items fit on screen (${test.title})`, () => {
					if(test.params.mobile)
						visitHome({}, null, pretendToBeMobile);
					 else
						visitHome();


					cy.fixture("getMessageWithCarouselTextItems.json")
						.as("getMessageResponse");

					// Intercept GET messages and return a fixture message with the carousel items
					cy.get("@getMessageResponse")
						.then((fixture) => {
							// Dynamically create carousel items
							const updatedFixture = fixture;
							const carouselItem = updatedFixture.data[0].carousel[0];
							updatedFixture.data[0].carousel = [];
							for(let i = 0; i < test.params.carouselItems; i++) {
								carouselItem.title = `This is a title #${i}`;
								carouselItem.title = `This is the carousel body #${i}}`;
								updatedFixture.data[0].carousel.push(carouselItem);
							}

							cy.intercept("GET", messagesUrlRegex, (req) => {
								req.reply(updatedFixture);
							});
						});

					clickOnLauncher();

					cy.get("@app")
						.find("[class^=parley-messaging-message__]")
						.as("messages");

					// Navigation should not exist if all the items fit on the screen
					cy.get("[class^=parley-messaging-navButton__]")
						.should("not.exist");
				});
			});
			it("should show carousel with image items", () => {
				visitHome();

				cy.fixture("getMessageWithCarouselImageItems.json")
					.as("getMessageResponse");

				// Intercept GET messages and return a fixture message with an image in it
				cy.get("@getMessageResponse")
					.then((fixture) => {
						cy.intercept("GET", messagesUrlRegex, (req) => {
							req.reply(fixture);
						});
					});

				// Intercept the retrieval of the image binary
				cy.intercept("GET", "*/**/media/**/*", {fixture: "image.png"});

				clickOnLauncher();

				cy.get("@app")
					.find("[class^=parley-messaging-carouselContainer__]")
					.should("have.length", 1)
					.find("[class^=parley-messaging-messageBubble__]")
					.should("have.length", 2)
					.find("[class^=parley-messaging-message__]")
					.first()
					.find("[class^=parley-messaging-image__]")
					.should("be.visible");
			});
			it("should show carousel with button items", () => {
				visitHome();

				cy.fixture("getMessageWithCarouselButtonItems.json")
					.as("getMessageResponse");

				// Intercept GET messages and return a fixture message with an image in it
				cy.get("@getMessageResponse")
					.then((fixture) => {
						cy.intercept("GET", messagesUrlRegex, (req) => {
							req.reply(fixture);
						});
					});

				clickOnLauncher();

				cy.get("@getMessageResponse")
					.then((fixture) => {
						fixture.data[0].carousel[0].buttons.forEach((button, buttonIndex) => {
							cy.get("@app")
								.find("[class^=parley-messaging-carouselContainer__]")
								.find("[class^=parley-messaging-message__]")
								.first()
								.find("[class^=parley-messaging-button__]")
								.its(buttonIndex)
								.should("have.text", button.title)
								.should("be.visible");
						});
					});
			});
		});
		it("should render title when received", () => {
			visitHome();

			cy.fixture("getMessageWithTitleResponse.json")
				.as("getMessageResponse");

			cy.get("@getMessageResponse")
				.then((fixture) => {
					cy.intercept("GET", messagesUrlRegex, (req) => {
						req.reply(fixture);
					});
				});

			clickOnLauncher();

			cy.get("@getMessageResponse")
				.then((fixture) => {
					cy.get("@app")
						.find("[class^=parley-messaging-message__]")
						.find("h2")
						.should("have.text", fixture.data[0].title);
				});
		});
		it("should render all message parts in the correct order", () => {
			visitHome();

			cy.fixture("getMessageWithAllPartsResponse.json")
				.as("getMessageResponse");

			cy.get("@getMessageResponse")
				.then((fixture) => {
					cy.intercept("GET", messagesUrlRegex, (req) => {
						req.reply(fixture);
					});
				});

			cy.intercept("GET", "*/**/media/**/*", {fixture: "image.png"});

			clickOnLauncher();

			cy.get("@app")
				.find("[class^=parley-messaging-message__]")
				.children()
				.as("children");
			cy.get("@children")
				.eq(0)
				.should("have.attr", "aria-label", InterfaceTexts.english.ariaLabelMessageTitle);
			cy.get("@children")
				.eq(1)
				.should("have.attr", "aria-label", InterfaceTexts.english.ariaLabelMessageMedia);
			cy.get("@children")
				.eq(2)
				.should("have.attr", "aria-label", InterfaceTexts.english.ariaLabelMessageBody);
			cy.get("@children")
				.eq(3)
				.should("have.attr", "aria-label", InterfaceTexts.english.ariaLabelMessageButtons);
		});
		it("should scroll to the newest message if the chat has not been scrolled manually", () => {
			// Return a bunch of messages initially
			cy.fixture("getMessagesResponse.json")
				.as("fixture");

			cy.get("@fixture")
				.then((fixture) => {
					for(let i = 1; i < 10; i++) {
						fixture.data.push({
							...fixture.data[0],
							id: fixture.data[i - 1].id + 1,
							time: fixture.data[i - 1].time + 5,
							message: `extra message #${i}`,
						});
					}

					// Important to only intercept the GET /messages and not the GET /messages/after:xxx
					// because we only want to intially return a bunch of messages
					cy.intercept("GET", "*/**/messages", (req) => {
						req.reply(fixture);
					});
				});

			visitHome();
			clickOnLauncher();

			// Return a new message
			const newMessageText = `This message should be visible ${Date.now()}`;
			cy.get("@fixture")
				.then((fixture) => {
					// eslint-disable-next-line no-param-reassign
					fixture.data = [
						{
							...fixture.data[0],
							id: 999999, // Too lazy to find out what the latest id is from the previous batch
							time: Date.now(),
							message: newMessageText,
						},
					];
					cy.intercept("GET", "*/**/messages/after:*", (req) => {
						req.reply(fixture);
					})
						.as("getNewMessage");
				});

			cy.wait("@getNewMessage");

			// Validate that we have scrolled to that message
			findMessage(newMessageText);
		});
		it("should scroll to the newest message if the chat was closed but popped open by a new message", () => {
			// Return a bunch of messages initially
			cy.fixture("getMessagesResponse.json")
				.as("fixture");

			// Intercept the count which is responsible for popping open the chat window
			cy.intercept("GET", "*/**/messages/unseen/count", {fixture: "getMessagesUnreadCountResponse.json"})
				.as("getUnseenMessagesCount");

			cy.get("@fixture")
				.then((fixture) => {
					for(let i = 1; i < 10; i++) {
						fixture.data.push({
							...fixture.data[0],
							id: fixture.data[i - 1].id + 1,
							time: fixture.data[i - 1].time + 5,
							message: `extra message #${i}`,
						});
					}

					cy.wrap(fixture.data[fixture.data.length - 1].message)
						.as("lastMessage");

					// Important to only intercept the GET /messages and not the GET /messages/after:xxx
					// because we only want to intially return a bunch of messages
					cy.intercept("GET", "*/**/messages", (req) => {
						req.reply(fixture);
					}).as("getMessages");
				});

			cy.window()
				.then((win) => {
					// These things are necessary for slow polling to start
					// and in turn for opening the chat window on new messages
					win.localStorage.setItem("messengerOpenState", "minimize");
					win.localStorage.setItem("deviceInformation", JSON.stringify({deviceIdentification: "aaaaaaaa-ac09-4ee5-8631-abf4d9f4885b"}));
				});
			visitHome();

			cy.wait("@getUnseenMessagesCount");
			cy.wait("@getMessages");

			// Validate that we have scrolled to the latest message
			cy.get("@lastMessage")
				.then((lastMessage) => {
					cy.get("@app")
						.find("[class^=parley-messaging-wrapper__]")
						.should("be.visible")
						.find("[class^=parley-messaging-body__]")
						.should("be.visible")
						.contains(lastMessage)
						.should("be.visible");
				});
		});
		it("should not scroll to the newest message if the chat has been scrolled manually", () => {
			// Return a bunch of messages initially
			cy.fixture("getMessagesResponse.json")
				.as("fixture");

			cy.get("@fixture")
				.then((fixture) => {
					for(let i = 1; i < 10; i++) {
						fixture.data.push({
							...fixture.data[0],
							id: fixture.data[i - 1].id + 1,
							time: fixture.data[i - 1].time + 5,
							message: `extra message #${i}`,
						});
					}

					// Important to only intercept the GET /messages and not the GET /messages/after:xxx
					// because we only want to intially return a bunch of messages
					cy.intercept("GET", "*/**/messages", (req) => {
						req.reply(fixture);
					}).as("getMessages");
				});

			visitHome();
			clickOnLauncher();

			cy.wait("@getMessages");

			// Scroll a bit up
			cy.get("[class^=parley-messaging-body__]")
				.realMouseWheel({deltaY: -500});

			// Return a new message
			const newMessageText = `This message should NOT be visible ${Date.now()}`;
			cy.get("@fixture")
				.then((fixture) => {
					// eslint-disable-next-line no-param-reassign
					fixture.data = [
						{
							...fixture.data[0],
							id: 999999, // Too lazy to find out what the latest id is from the previous batch
							time: Date.now(),
							message: newMessageText,
						},
					];
					cy.intercept("GET", "*/**/messages/after:*", (req) => {
						req.reply(fixture);
					})
						.as("getNewMessage");
				});

			cy.wait("@getNewMessage");

			// Validate that we have scrolled to that message
			cy.get("@app")
				.find("[class^=parley-messaging-wrapper__]")
				.should("be.visible")
				.find("[class^=parley-messaging-body__]")
				.should("be.visible")
				.contains(newMessageText)
				.should("not.be.visible");
		});
		describe("history", () => {
			it("should fetch and show older messages when scrolling to the top", () => {
				const generatedMessages = generateParleyMessages(150);
				const secondBatchOldMessages = generatedMessages.slice(0, 50);
				const firstBatchOldMessages = generatedMessages.slice(50, 100);
				const initialMessages = generatedMessages.slice(100, 150);

				cy.fixture("getMessagesResponse.json")
					.then((fixture) => {
						// eslint-disable-next-line no-param-reassign

						cy.intercept("GET", messagesUrlRegex, req => req.reply({
							...fixture,
							data: initialMessages,
						}))
							.as("fetchInitialMessages");
						cy.intercept("GET", `/**/messages/before:${initialMessages[0].id}`, req => req.reply({
							...fixture,
							data: firstBatchOldMessages,
						}))
							.as("fetchFirstBatch");
						cy.intercept("GET", `/**/messages/before:${firstBatchOldMessages[0].id}`, req => req.reply({
							...fixture,
							data: secondBatchOldMessages,
						}))
							.as("fetchSecondBatch");
						cy.intercept("GET", `/**/messages/before:${secondBatchOldMessages[0].id}`, req => req.reply({
							...fixture,
							data: [],
						}))
							.as("fetchEmptyBatch");
						cy.intercept("GET", "/**/messages/before:*", cy.spy().as("fetchOlderMessages"));
					});

				visitHome();
				clickOnLauncher();

				cy.wait("@fetchInitialMessages");

				// Scroll to oldest message
				cy.get("[class^=parley-messaging-message__")
					.contains(initialMessages[0].message)
					.scrollIntoView();

				// Validate that the older messages are being fetch
				cy.wait("@fetchFirstBatch");

				// Scroll to the oldest message again
				cy.get("[class^=parley-messaging-message__")
					.contains(firstBatchOldMessages[0].message)
					.scrollIntoView();

				// Validate that the older messages are being fetch
				cy.wait("@fetchSecondBatch");

				// Scroll to the oldest message again
				cy.get("[class^=parley-messaging-message__")
					.contains(secondBatchOldMessages[0].message)
					.scrollIntoView();

				// Validate that we try to fetch older messages (this returns an empty array)
				cy.wait("@fetchEmptyBatch");

				// Scroll down a bit
				cy.get("[class^=parley-messaging-message__")
					.contains(initialMessages[0].message)
					.scrollIntoView();

				// Scroll back up
				cy.get("[class^=parley-messaging-message__")
					.contains(secondBatchOldMessages[0].message)
					.scrollIntoView();

				// This should NOT trigger another fetch since the last fetch
				// resulted in an empty array so the chat knows it should stop
				// checking for old messages

				// Validate that we have tried to get messages 3 times and not more than that
				// even when we scroll to the top multiple times
				cy.get("@fetchOlderMessages")
					.should("have.been.calledThrice");
			});
		});
	});
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
							.find("[class^=parley-messaging-uploadLabel__]")
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
						.find("[class^=parley-messaging-uploadLabel__]")
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
						.find("[class^=parley-messaging-uploadLabel__]")
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

				cy.visit("/", {
					onBeforeLoad: (win) => {
						// eslint-disable-next-line no-param-reassign
						win.parleySettings = parleyConfig;
					},
				});

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

					cy.visit("/", {
						onBeforeLoad: (win) => {
							// eslint-disable-next-line no-param-reassign
							win.parleySettings = parleyConfig;
						},
					});

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
								.should("have.length", 1)
								.then((cookies) => {
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
						.should("have.length", 1)
						.then((cookies) => {
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
						.should("have.length", 1)
						.then((cookies) => {
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
						.its(0)
						.its("expiry")
						.should("not.exist");

					cy.clock()
						.tick(parleyConfig.devicePersistence.ageUpdateInterval * 10); // Go 10 times the interval into the future

					cy.getCookies()
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
						.its(0)
						.its("expiry")
						.should("not.exist");

					cy.clock()
						.tick(60 * 60); // Go into the future

					cy.getCookies()
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

					visitHome(parleyConfig);

					clickOnLauncher();

					cy.wait("@postDevices");
					cy.wait("@getMessages");

					cy.getCookies()
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

						cy.clock(new Date().getTime()); // Start the clock override

						visitHome(parleyConfig);

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
							.its(0)
							.its("value")
							.as("cookieIdentificationValue");

						// Validate that we have successfully set the expiry time on the cookie
						cy.getCookies()
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
						visitHome(parleyConfigWithoutInterval);

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
		});
	});
	describe("component structure", () => {
		beforeEach(() => {
			cy.visit("/", {
				onLoad: (window) => {
					window.initParleyMessenger();
				},
			});

			cy.get("[id=app]")
				.as("app");
		});

		describe("launcher", () => {
			it("should have an id", () => {
				cy.get("@app")
					.find("[class^=parley-messaging-launcher__]")
					.find("button")
					.should("have.id", "launcher");
			});
		});
		describe("Announcement", () => {
			describe("Welcome message", () => {
				it("should be shown underneath the latest date if available", () => {
					// Create a conversation that was started yesterday
					const yesterday = new Date(Date.now() - 86400000).getTime();
					const initialMessages = [
						...generateParleyMessages(4, yesterday),
						...generateParleyMessages(1),
					];
					cy.fixture("getMessagesResponse.json")
						.then((fixture) => {
							// eslint-disable-next-line no-param-reassign

							cy.intercept("GET", messagesUrlRegex, req => req.reply({
								...fixture,
								data: initialMessages,
							}))
								.as("fetchInitialMessages");

							cy.wrap(fixture.welcomeMessage).as("welcomeMessageText");
						});

					visitHome();
					clickOnLauncher();
					cy.wait("@fetchInitialMessages");

					cy.get("[class*=parley-messaging-announcement__]").first()
						.as("announcement");
					cy.get("[class*=parley-messaging-date]").last()
						.as("date");

					// eslint-disable-next-line func-names
					cy.then(function () {
						// Check that the welcome message has the expected text
						expect(this.announcement).to.have.text(this.welcomeMessageText);

						// Check that the welcome message is underneath the date
						// eslint-disable-next-line no-bitwise
						const comparePos = this.date[0].compareDocumentPosition(this.announcement[0])
							& Node.DOCUMENT_POSITION_FOLLOWING;
						// eslint-disable-next-line no-unused-expressions
						expect(comparePos).to.be.ok;
					});
				});
				it("should be shown at the bottom if there are messages but not from today", () => {
					// Create a conversation that was started yesterday
					const yesterday = new Date(Date.now() - 86400000).getTime();
					const initialMessages = generateParleyMessages(4, yesterday);
					cy.fixture("getMessagesResponse.json")
						.then((fixture) => {
							// eslint-disable-next-line no-param-reassign

							cy.intercept("GET", messagesUrlRegex, req => req.reply({
								...fixture,
								data: initialMessages,
								stickyMessage: null,
							}))
								.as("fetchMessages");

							cy.wrap(fixture.welcomeMessage).as("welcomeMessageText");
						});

					visitHome();
					clickOnLauncher();
					cy.wait("@fetchMessages");

					cy.get("[class*=parley-messaging-announcement__]")
						.should("be.visible")
						.as("announcement");

					// "Send" a new message
					const testMessage = "Chuck Norris can build a snowman with rain";
					cy.fixture("getMessagesResponse.json")
						.then((fixture) => {
							// eslint-disable-next-line no-param-reassign

							cy.intercept("GET", messagesUrlRegex, req => req.reply({
								...fixture,
								data: [
									...initialMessages,
									{
										id: 9999,
										time: Date.now() / 1000,
										message: testMessage,
										image: null,
										typeId: 1,
										carousel: [],
										quickReplies: [],
										custom: [],
										title: null,
										media: null,
										buttons: [],
									},
								],
								stickyMessage: null,
							}))
								.as("fetchMessages");
						});

					// Trigger new fetch so we don't have to wait for the interval
					cy.get("@app")
						.find("[class^=parley-messaging-text__]")
						.should("be.visible")
						.find("textarea")
						.click();

					cy.wait("@fetchMessages");
					findMessage(testMessage)
						.as("testMessage");

					// We have to re-get the announcement
					// Sometimes this reference disappears and we need it in the next check
					cy.get("[class*=parley-messaging-announcement__]")
						.should("be.visible")
						.as("announcement");

					// Make sure the position of the welcome message is correct
					// eslint-disable-next-line func-names
					cy.then(function () {
						// Check that the welcome message is above the new message
						// eslint-disable-next-line no-bitwise
						const comparePos = this.announcement[0].compareDocumentPosition(this.testMessage[0])
							& Node.DOCUMENT_POSITION_FOLLOWING;
						// eslint-disable-next-line no-unused-expressions
						expect(comparePos).to.be.ok;
					});
				});
				it("should be shown above the sticky message if the date is not available", () => {
					// Create an empty conversation
					cy.fixture("getMessagesResponse.json")
						.then((fixture) => {
							// eslint-disable-next-line no-param-reassign

							cy.intercept("GET", messagesUrlRegex, req => req.reply({
								...fixture,
								data: [],
							}))
								.as("fetchInitialMessages");

							cy.wrap(fixture.welcomeMessage).as("welcomeMessageText");
						});

					visitHome();
					clickOnLauncher();
					cy.wait("@fetchInitialMessages");

					cy.get("[class*=parley-messaging-announcement__]").first()
						.as("announcement");
					cy.get("[class*=parley-messaging-announcement__]").eq(1)
						.as("stickyMessages");

					// eslint-disable-next-line func-names
					cy.then(function () {
						// Check that the welcome message has the expected text
						expect(this.announcement).to.have.text(this.welcomeMessageText);

						// Check that the welcome message is underneath the date
						// eslint-disable-next-line no-bitwise
						const comparePos = this.announcement[0].compareDocumentPosition(this.stickyMessages[0])
							& Node.DOCUMENT_POSITION_FOLLOWING;
						// eslint-disable-next-line no-unused-expressions
						expect(comparePos).to.be.ok;
					});
				});
				it("should be shown even if there is no sticky message and no conversation messages", () => {
					// Create an empty conversation
					cy.fixture("getMessagesResponse.json")
						.then((fixture) => {
							// eslint-disable-next-line no-param-reassign

							cy.intercept("GET", messagesUrlRegex, req => req.reply({
								...fixture,
								data: [],
								stickyMessage: null,
							}))
								.as("fetchInitialMessages");

							cy.wrap(fixture.welcomeMessage).as("welcomeMessageText");
						});

					visitHome();
					clickOnLauncher();
					cy.wait("@fetchInitialMessages");

					cy.get("[class*=parley-messaging-announcement__]").first()
						.should("be.visible");
				});
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
				cy.get("[id=app]")
					.as("app");
				cy.window()
					.then((win) => {
						const window = {...win};
						window.parleySettings.authHeader = authorization;
						window.parleySettings.apiVersion = apiVersion;
					});
				clickOnLauncher();
				sendMessage(testMessage);
				cy.window()
					.then((win) => {
						// get the Parley setting information which was created inside the local storage
						cy.wrap(win.localStorage.getItem("deviceInformation"))
							.then((value) => {
								const parsedValue = JSON.parse(value);
								cy.wrap(parsedValue.deviceIdentification)
									.should("exist");
								cy.wrap(parsedValue.accountIdentification)
									.should("not.exist");
								cy.wrap(parsedValue.userAdditionalInformation)
									.should("not.exist");
								cy.wrap(parsedValue.authorization)
									.should("not.exist");
								cy.wrap(parsedValue.version)
									.should("not.exist");
								cy.wrap(parsedValue.type)
									.should("not.exist");
								cy.wrap(parsedValue.pushToken)
									.should("not.exist");
								cy.wrap(parsedValue.pushType)
									.should("not.exist");
								cy.wrap(parsedValue.pushEnabled)
									.should("not.exist");
								cy.wrap(parsedValue.referer)
									.should("not.exist");
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
				.find("[class^=parley-messaging-launcher__]")
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
					.find("div[class*=parley-messaging-state-minimize__]")
					.should("exist");
				cy.get("#app")
					.find("div[class*=parley-messaging-state-open__]")
					.should("not.exist");
			});
			it("should contain the class name 'state-open' when the chat has been opened'", () => {
				visitHome();
				clickOnLauncher();
				cy.get("#app")
					.find("div[class*=parley-messaging-state-open]")
					.should("exist");
				cy.get("#app")
					.find("div[class*=parley-messaging-state-minimize]")
					.should("not.exist");
			});
		});
		describe("using value 'minimize' in storage", () => {
			beforeEach(() => {
				cy.window()
					.then((win) => {
						win.localStorage.setItem("messengerOpenState", "minimize");
					});
			});
			it(`should not show the chat if the value is 'minimize' but you have not registered your device yet`, () => {
				cy.intercept("POST", "*/**/devices", cy.spy().as("postDevicesSpy"));

				visitHome({interface: {unreadMessagesAction: 0}});

				cy.get("@app")
					.find("[class^=parley-messaging-launcher__]")
					.find("button")
					.should("be.visible");

				// We need to wait for the chat to complete it's `componentDidMount()`
				// to see if it decides to start the polling service or not.
				// I don't see a better way of checking this...
				// eslint-disable-next-line cypress/no-unnecessary-waiting
				cy.wait(2000);

				// POST devices should not have been called on app startup
				cy.get("@postDevicesSpy").should("not.have.been.called");

				// Chat window should not be visible since there is no device registration
				cy.get("@app")
					.find("[class^=parley-messaging-chat__]")
					.should("not.be.visible");

				// Refresh page
				cy.reload();

				cy.get("@app")
					.find("[class^=parley-messaging-launcher__]")
					.find("button")
					.should("be.visible");

				// We need to wait for the chat to complete it's `componentDidMount()`
				// to see if it decides to start the polling service or not.
				// I don't see a better way of checking this...
				// eslint-disable-next-line cypress/no-unnecessary-waiting
				cy.wait(2000);

				// POST devices should still not have been called on app startup
				cy.get("@postDevicesSpy").should("not.have.been.called");

				// Chat window should not be visible since there is still no device registration
				cy.get("@app")
					.find("[class^=parley-messaging-chat__]")
					.should("not.be.visible");
			});
		});
	});
	describe("images", () => {
		it("should open the fullscreen view on click and close it with the close button", () => {
			visitHome();

			// Intercept GET messages and return a fixture message with an image in it
			cy.intercept("GET", messagesUrlRegex, {fixture: "getMessageWithImageResponse.json"});

			// Intercept the request for the image binary
			cy.intercept("GET", "*/**/media/**/*", {fixture: "image.png"});

			clickOnLauncher();

			// Find image and click on it
			cy.get("@app")
				.find("[class^=parley-messaging-message__]")
				.find("input[type=image]")
				.first()
				.click();

			// Find fullscreen image container
			// and close it
			cy.get("@app")
				.find("[class^=parley-messaging-container__]")
				.should("be.visible")
				.find("img[class^=parley-messaging-image]")
				.should("be.visible")
				.parent()
				.find("button[class^=parley-messaging-closeButton__]")
				.should("be.visible")
				.click();

			// Make sure image container is gone
			cy.get("@app")
				.find("[class^=parley-messaging-container__]")
				.should("not.exist");
		});
	});
	describe("media", () => {
		it(`should show a loading icon while download the media file`, () => {
			const fileName = "some-pdf.pdf";

			cy.fixture("getMessageWithPdfResponse.json")
				.then((fixture) => {
					const _fixture = fixture;
					_fixture.data[0].media.filename = fileName;
					_fixture.data[0].media.description = null;
					return _fixture;
				})
				.then(fixture => cy.intercept("GET", messagesUrlRegex, {body: fixture})
					.as("getMessages"));

			// We don't want to return a file otherwise the chat will download this file everytime we run the test
			// That is why we return an empty body
			const interception
				= interceptIndefinitely("GET", "*/**/media/**", {body: ""});

			visitHome();

			clickOnLauncher();

			cy.wait("@getMessages");

			cy.get("div[class^=parley-messaging-messageBoxMedia__]")
				.find("button[class^=parley-messaging-messageBoxMediaDownload__]")
				.as("downloadButton")
				.click();

			// Loading animation should show
			cy.get("@downloadButton")
				.find("span[class^=parley-messaging-loading__]")
				.should("exist")
				.get("@downloadButton")
				.find("span[class^=parley-messaging-wrapperDownloadAltIcon__]")
				.should("not.exist")
				.then(interception.sendResponse);

			// Loading animation should be gone and button should show the normal icon again
			cy.get("@downloadButton")
				.find("span[class^=parley-messaging-loading__]")
				.should("not.exist")
				.get("@downloadButton")
				.find("span[class^=parley-messaging-wrapperDownloadAltIcon__]")
				.should("exist");
		});
	});
});
