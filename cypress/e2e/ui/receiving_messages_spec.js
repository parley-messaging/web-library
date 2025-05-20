import {InterfaceTexts} from "../../../src/UI/Scripts/Context";
import {
	_afterEach,
	_beforeEach,
	clickOnLauncher,
	findMessage,
	generateParleyMessages, messagesUrlRegex,
	pretendToBeMobile, visitHome,
} from "../../support/utils";

beforeEach(_beforeEach);
afterEach(_afterEach);

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
		it.only("should fetch and show older messages when scrolling to the top", () => {
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
	it("should announce messages to the screen reader", () => {
		visitHome();

		const generatedMessages = generateParleyMessages(2, Date.now(), 1);
		cy.fixture("getMessagesResponse.json")
			.then((fixture) => {
				cy.intercept("GET", messagesUrlRegex, req => req.reply({
					...fixture,
					data: [generatedMessages[0]],
				}))
					.as("fetchInitialMessages");

				cy.intercept("GET", `/**/messages/after:${generatedMessages[0].id}`, req => req.reply({
					...fixture,
					data: [generatedMessages[1]],
				}))
					.as("fetchNewMessages");
			});

		clickOnLauncher();

		cy.wait("@fetchInitialMessages");
		cy.wait("@fetchNewMessages");

		cy.get("div[data-live-announcer='true']")
			.should("exist")
			.find("div[aria-live='assertive']")
			.should("exist")
			.should("contain", InterfaceTexts.english.screenReaderNewMessageAnnouncement(generatedMessages[1].agent.name, generatedMessages[1].message, generatedMessages[1].time));
	});
});
