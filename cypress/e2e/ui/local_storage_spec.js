import {_afterEach, _beforeEach, clickOnLauncher, sendMessage, visitHome} from "../../support/utils";

beforeEach(_beforeEach);
afterEach(_afterEach);

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
