import {_afterEach, _beforeEach, clickOnLauncher, visitHome} from "../../support/utils";

beforeEach(_beforeEach);
afterEach(_afterEach);

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
		visitHome(); // Dont use cy.reload() as this can crash the accessibility test

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
		visitHome();

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
			visitHome();

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
