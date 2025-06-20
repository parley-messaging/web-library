import {
	_afterEach,
	_beforeEach, clickOnLauncher,
	findMessage,
	interceptIndefinitely, messagesUrlRegex,
	pretendToBeMobile,
	sendMessage, visitHome,
} from "../../support/utils";

beforeEach(_beforeEach);
afterEach(_afterEach);

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

		cy.get("button[class^=parley-messaging-uploadButton__]")
			.should("exist");

		cy.get("@app")
			.find("[class^=parley-messaging-chat__]")
			.find("[class^=parley-messaging-footer__]")
			.find("[class^=parley-messaging-text__]")
			.find("textarea")
			.type(`This is some text`);

		cy.get("button[class^=parley-messaging-uploadButton__]")
			.should("not.exist");
		cy.get("button[class^=parley-messaging-mobile__]")
			.should("exist");
	});
});
