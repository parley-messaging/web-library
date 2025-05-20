import {
	_afterEach,
	_beforeEach,
	clickOnLauncher,
	interceptIndefinitely,
	messagesUrlRegex,
	visitHome,
} from "../../support/utils";

beforeEach(_beforeEach);
afterEach(_afterEach);

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
