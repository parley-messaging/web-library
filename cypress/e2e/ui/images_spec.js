import {_afterEach, _beforeEach, clickOnLauncher, messagesUrlRegex, visitHome} from "../../support/utils";

beforeEach(_beforeEach);
afterEach(_afterEach);

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
