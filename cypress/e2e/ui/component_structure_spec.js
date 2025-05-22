/* eslint-disable @babel/no-invalid-this */
import {
	_afterEach,
	_beforeEach,
	clickOnLauncher,
	findMessage,
	generateParleyMessages, messagesUrlRegex,
	visitHome,
} from "../../support/utils";

beforeEach(_beforeEach);
afterEach(_afterEach);

describe("component structure", () => {
	beforeEach(() => {
		visitHome({}, () => window.initParleyMessenger);

		cy.get("[id=app]")
			.as("app");
	});

	describe("launcher", () => {
		// noinspection ignore-missing-accessibility-test
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
	describe("Chat", () => {
		it("should have a role attribute and aria attributes", () => {
			// For WCAG21 Success Criterion 4.1.2: Name, Role, Value
			// it is necessary to have some kind of role defined for the chat window.

			visitHome();
			clickOnLauncher();

			cy.get("#chat")
				.should("have.attr", "role", "dialog")
				.should("have.attr", "aria-modal", "true")
				.should("have.attr", "aria-labelledby", "header");

			// Make sure the header is actually a valid header
			cy.get("h1#header")
				.should("be.visible");
		});
	});
});
