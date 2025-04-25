/* eslint-disable compat/compat */
// Don't need compat checking here because this code will only
// run on development systems

import Api from "../../src/Api/Api";
import ApiEventTarget from "../../src/Api/ApiEventTarget";
import Config from "../../src/Api/Private/Config";
import {media, mediaUploaded, messages, messageSent, subscribe} from "../../src/Api/Constants/Events";
import {FCMWeb} from "../../src/Api/Constants/PushTypes";
import {Web} from "../../src/Api/Constants/DeviceTypes";
import {DeviceVersionRegex} from "../../src/Api/Constants/Other";
import {CUSTOMHEADER_BLACKLIST} from "../../src/Api/Constants/CustomHeaderBlacklist";
import {interceptIndefinitely} from "../support/utils";

const config = {
	apiDomain: "https://fake.parley.nu",
	accountIdentification: "0cce5bfcdbf07978b269",
	deviceIdentification: "weblib-v2_cypress-test",
	pushToken: "weblib-v2_cypress-test+pushToken",
	pushType: FCMWeb,
	userAdditionalInformation: {name: "weblib-v2_cypress-test"},
	type: Web,
	version: "010000",
	message: "test message",
	referer: "weblib-v2_cypress-test",
	customHeaders: {},
	authorization: "someauthorization",
};
const primitiveTypes = [
	{
		type: "string",
		value: "somestring",
	},
	{
		type: "number",
		value: 123,
	},
	{
		type: "boolean",
		value: false,
	},
	{
		type: "undefined",
		value: undefined,
	},
	{
		type: "null",
		value: null,
	},
	{
		type: "Object", // Must be uppercase for `ow()` error messages
		value: {},
	},
];

function filterPrimitives(excludePrimitiveTypes = []) {
	return primitiveTypes.filter(set => !excludePrimitiveTypes.includes(set.type));
}

function requestExpectations(req) {
	expect(req.headers)
		.to
		.have
		.property("x-iris-identification");
}

describe("Api class", () => {
	beforeEach(() => {
		console.log("");
		console.log(`=== ${Cypress.currentTest.title} ===`);
		console.log("");

		config.api = new Api(
			config.apiDomain,
			config.accountIdentification,
			config.deviceIdentification,
			ApiEventTarget,
			config.customHeaders,
		);

		// Intercept api calls and respond with a static response
		// This way we don't fill up the API with test data
		cy.fixture("postDevicesResponse.json")
			.as("postDevicesResponse");
		cy.fixture("postMessagesResponse.json")
			.as("postMessagesResponse");
		cy.fixture("1x1.png", "latin1")
			.as("getMediaResponse");
		cy.fixture("postMediaResponse.json")
			.as("postMediaResponse");
		cy.fixture("pdf.pdf")
			.then((fixture) => {
				return new File([fixture], "pdf.pdf");
			})
			.as("mediaFile");
		cy.fixture("getMessagesResponse.json")
			.as("getMessagesResponse");
		cy.get("@postDevicesResponse")
			.then((json) => {
				cy.intercept("POST", `${config.apiDomain}/**/devices`, (req) => {
					requestExpectations(req);

					req.reply(json);
				})
					.as("postDevices");
			});
		cy.get("@postMessagesResponse")
			.then((json) => {
				cy.intercept("POST", `${config.apiDomain}/**/messages`, (req) => {
					requestExpectations(req);

					req.reply(json);
				})
					.as("postMessages");
			});
		cy.get("@getMediaResponse")
			.then((mediaFile) => {
				cy.intercept("GET", `${config.apiDomain}/**/media/**/*`, (req) => {
					requestExpectations(req);

					req.reply({
						body: mediaFile,
						headers: {"Content-Type": "image/png"},
					});
				})
					.as("getMedia");
			});
		cy.get("@postMediaResponse")
			.then((json) => {
				cy.intercept("POST", `${config.apiDomain}/**/media`, (req) => {
					requestExpectations(req);

					req.reply(json);
				});
			});
		cy.get("@getMessagesResponse")
			.then((json) => {
				cy.intercept("GET", `${config.apiDomain}/**/messages/before:*`, (req) => {
					requestExpectations(req);

					req.reply(json);
				})
					.as("getMessagesBeforeId");
				cy.intercept("GET", `${config.apiDomain}/**/messages/after:*`, (req) => {
					requestExpectations(req);

					req.reply(json);
				})
					.as("getMessagesAfterId");
				cy.intercept("GET", `${config.apiDomain}/**/messages`, (req) => {
					requestExpectations(req);

					req.reply(json);
				})
					.as("getMessages");
			});


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

	describe("constructor", () => {
		it("should create a new Api object with all it's properties set", () => {
			expect(config.api.config)
				.to
				.be
				.instanceOf(Config);
			expect(config.api.config.apiDomain)
				.to
				.be
				.equal(config.apiDomain);
			expect(config.api.accountIdentification)
				.to
				.be
				.equal(config.accountIdentification);
			expect(config.api.deviceIdentification)
				.to
				.be
				.equal(config.deviceIdentification);
			expect(config.api.eventTarget)
				.to
				.be
				.equal(ApiEventTarget);
		});
		it("should throw an error when using something other than a EventTarget as apiEventTarget", () => {
			expect(() => new Api(config.apiDomain, config.accountIdentification, config.deviceIdentification, {}))
				.to
				.throw("Expected object `apiEventTarget` `{}` to be of type `EventTarget`");
		});
	});

	describe("setDomain()", () => {
		it("should change the apiDomain", () => {
			const newDomain = "someotherdomain";
			config.api.setDomain(newDomain);

			expect(config.api.config.apiDomain)
				.to
				.be
				.equal(newDomain);
		});

		filterPrimitives(["string"])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as domain`, () => {
					expect(() => config.api.setDomain(set.value))
						.to
						.throw(`Expected \`apiDomain\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});
		it("should throw an error when using an Empty string as domain", () => {
			expect(() => config.api.setDomain(""))
				.to
				.throw("Expected string `apiDomain` to not be empty");
		});
	});

	describe("setAccountIdentification()", () => {
		it("should change the accountIdentification", () => {
			const newAccountIdentification = "someotheraccountidentfication";
			config.api.setAccountIdentification(newAccountIdentification);

			expect(config.api.accountIdentification)
				.to
				.be
				.equal(newAccountIdentification);
		});
		filterPrimitives(["string"])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as accountIdentification`, () => {
					expect(() => config.api.setAccountIdentification(set.value))
						.to
						.throw(`Expected \`accountIdentification\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});
		it("should throw an error when using an Empty string as accountIdentification", () => {
			expect(() => config.api.setAccountIdentification(""))
				.to
				.throw("Expected string `accountIdentification` to not be empty");
		});
	});

	describe("setDeviceIdentification()", () => {
		it("should change the deviceIdentification", () => {
			const newDeviceIdentification = "someotherdeviceidentfication";
			config.api.setDeviceIdentification(newDeviceIdentification);

			expect(config.api.deviceIdentification)
				.to
				.be
				.equal(newDeviceIdentification);
		});
		filterPrimitives(["string"])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as deviceIdentification`, () => {
					expect(() => config.api.setDeviceIdentification(set.value))
						.to
						.throw(`Expected \`deviceIdentification\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});
		it("should throw an error when using an Empty string as deviceIdentification", () => {
			expect(() => config.api.setDeviceIdentification(""))
				.to
				.throw("Expected string `deviceIdentification` to not be empty");
		});
		it("should throw an error when using a short string as deviceIdentification", () => {
			// Min length is 10
			const identification = "aaaaaaaaa";
			expect(() => config.api.setDeviceIdentification(identification))
				.to
				.throw(`Expected string \`deviceIdentification\` to have a minimum length of \`10\`, got \`${identification}\``);
		});
	});

	describe("setAuthorization()", () => {
		it("should change the authorization", () => {
			const newAuthorization = "somenewauthorization";
			config.api.setAuthorization(newAuthorization);

			expect(config.api.authorization)
				.to
				.be
				.equal(newAuthorization);
		});

		filterPrimitives([
			"string", "undefined",
		])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as authorization`, () => {
					expect(() => config.api.setAuthorization(set.value))
						.to
						.throw(`Expected \`authorization\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});
	});

	describe("setCustomHeaders()", () => {
		it("should change the customHeaders", () => {
			const newCustomHeaders = {
				"x-custom-1": "1",
				"x-custom-2": "2",
			};
			config.api.setCustomHeaders(newCustomHeaders);

			expect(config.api.customHeaders)
				.to
				.be
				.equal(newCustomHeaders);
		});
		filterPrimitives([
			"Object", "undefined", "null", "boolean",
		])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as customHeaders`, () => {
					expect(() => config.api.setCustomHeaders(set.value))
						.to
						.throw(`Expected \`customHeaders\` to be of type \`object\` but received type \`${set.type}\``);
				});
			});

		it("should throw an error when using a blacklisted header as one of the custom headers", () => {
			CUSTOMHEADER_BLACKLIST.forEach((blacklistedHeaderKey) => {
				expect(() => config.api.setCustomHeaders({[blacklistedHeaderKey]: "some value"}))
					.to
					.throw(`(string \`${blacklistedHeaderKey}\`) This is a blacklisted header, please use a different header name`);
			});
		});

		it("should throw an error when using a 'reserved' prefix for one of the custom headers", () => {
			let reservedPrefixKey = "x-parley-test";
			let newCustomHeaders = {[reservedPrefixKey]: "some value"};

			expect(() => config.api.setCustomHeaders(newCustomHeaders))
				.to
				.throw(`Expected string \`${reservedPrefixKey}\` to not start with \`x-parley-\`, got \`${reservedPrefixKey}\``);

			reservedPrefixKey = "x-iris-test";
			newCustomHeaders = {[reservedPrefixKey]: "some value"};

			expect(() => config.api.setCustomHeaders(newCustomHeaders))
				.to
				.throw(`Expected string \`${reservedPrefixKey}\` to not start with \`x-iris-\`, got \`${reservedPrefixKey}\``);
		});
	});

	describe("subscribeDevice()", () => {
		filterPrimitives([
			"string",
			"undefined", // Don't test for undefined, because pushToken is optional and if we give undefined it will test for `version` next
		])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as pushToken`, () => {
					expect(() => config.api.subscribeDevice(
						set.value,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
					))
						.to
						.throw(`Expected \`pushToken\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		filterPrimitives([
			"number",
			"undefined", // Don't test for undefined, because pushType is optional and if we give undefined it will test for `version` next
		])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as pushType`, () => {
					expect(() => config.api.subscribeDevice(
						config.pushToken,
						set.value,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
					))
						.to
						.throw(`Expected \`pushType\` to be of type \`number\` but received type \`${set.type}\``);
				});
			});

		it("should throw an error when using invalid pushType", () => {
			const pushType = 9999;
			expect(() => config.api.subscribeDevice(
				config.pushToken,
				pushType,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
			))
				.to
				.throw(`Expected number \`pushType\` to be one of \`[1,2,3,4,5,6]\`, got ${pushType}`);
		});

		filterPrimitives([
			"boolean",
			"undefined", // Don't test for undefined, because pushEnabled is optional and if we give undefined it will test for `version` next
		])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as pushEnabled`, () => {
					expect(() => config.api.subscribeDevice(
						config.pushToken,
						config.pushType,
						set.value,
						undefined,
						undefined,
						undefined,
						undefined,
					))
						.to
						.throw(`Expected \`pushEnabled\` to be of type \`boolean\` but received type \`${set.type}\``);
				});
			});

		filterPrimitives([
			"string",
			"undefined", // Don't test for undefined, because pushToken is optional and if we give undefined it will test for `version` next
		])
			.forEach((set) => {
				it(`should throw an error when using 'pushEnabled = true' and '${set.type}' as pushToken`, () => {
					expect(() => config.api.subscribeDevice(
						set.value,
						config.pushType,
						true,
						undefined,
						undefined,
						undefined,
						undefined,
					))
						.to
						.throw(`Expected \`pushToken\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		filterPrimitives([
			"Object",
			"undefined", // Don't test for undefined, because userAdditionalInformation is optional and if we give undefined it will test for `version` next
		])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as userAdditionalInformation`, () => {
					expect(() => config.api.subscribeDevice(
						config.pushToken,
						config.pushType,
						true,
						set.value,
						undefined,
						undefined,
						undefined,
					))
						.to
						.throw(`Expected \`userAdditionalInformation\` to be of type \`object\` but received type \`${set.type}\``);
				});
			});

		filterPrimitives([
			"number",
			"boolean", // Boolean are numbers
			"undefined", // Don't test for undefined, because type is optional and if we give undefined it will test for `version` next
		])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as type`, () => {
					expect(() => config.api.subscribeDevice(
						config.pushToken,
						config.pushType,
						true,
						config.userAdditionalInformation,
						set.value,
						undefined,
						undefined,
					))
						.to
						.throw(`Expected \`type\` to be of type \`number\` but received type \`${set.type}\``);
				});
			});

		it("should throw an error when using invalid type", () => {
			const type = 9999;
			expect(() => config.api.subscribeDevice(
				config.pushToken,
				config.pushType,
				true,
				config.userAdditionalInformation,
				type,
				undefined,
				undefined,
			))
				.to
				.throw(`Expected number \`type\` to be one of \`[1,2,3,4]\`, got ${type}`);
		});

		filterPrimitives(["string"])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as version`, () => {
					expect(() => config.api.subscribeDevice(
						config.pushToken,
						config.pushType,
						true,
						config.userAdditionalInformation,
						config.type,
						set.value,
						undefined,
					))
						.to
						.throw(`Expected \`version\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		it("should throw an error when using invalid version", () => {
			// Min length
			const shortVersion = "1";
			expect(() => config.api.subscribeDevice(
				config.pushToken,
				config.pushType,
				true,
				config.userAdditionalInformation,
				config.type,
				shortVersion,
				config.referer,
			))
				.to
				.throw(`Expected string \`version\` to have a minimum length of \`5\`, got \`${shortVersion}\``);

			// Max length
			const longVersion = "100000000";
			expect(() => config.api.subscribeDevice(
				config.pushToken,
				config.pushType,
				true,
				config.userAdditionalInformation,
				config.type,
				longVersion,
				config.referer,
			))
				.to
				.throw(`Expected string \`version\` to have a maximum length of \`8\`, got \`${longVersion}\``);

			// Regex
			const wrongFormat = "v1.0.0";
			expect(() => config.api.subscribeDevice(
				config.pushToken,
				config.pushType,
				true,
				config.userAdditionalInformation,
				config.type,
				wrongFormat,
				config.referer,
			))
				.to
				.throw(`Expected string \`version\` to match \`${DeviceVersionRegex}\`, got \`${wrongFormat}\``);
		});

		filterPrimitives([
			"string",
			"undefined",
		])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as referer`, () => {
					expect(() => config.api.subscribeDevice(
						config.pushToken,
						config.pushType,
						true,
						config.userAdditionalInformation,
						config.type,
						config.version,
						set.value,
					))
						.to
						.throw(`Expected \`referer\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		it("should default referer to window.location.href", () => {
			cy.visit("/");

			config.api.subscribeDevice(
				config.pushToken,
				config.pushType,
				true,
				config.userAdditionalInformation,
				config.type,
				config.version,
				undefined,
			);

			cy.wait("@postDevices")
				.then((interception) => {
					cy.location("href")
						.then((href) => {
							expect(JSON.parse(interception.request.body).referer)
								.to
								.contain(href);

							// There is an issue where the window.location.href will contain "iframe/xxx"
							// due to how Cypress loads the chat, so we cannot check if the
							// href equals the href we get here
							// Instead we can only check if it begins with the href
							// Error when using `.equal(href)`
							// expected https://chat-dev.parley.nu:8181/__cypress/iframes/integration/api-class_spec.js to equal https://chat-dev.parley.nu:8181/
						});
				});
		});

		it("should fetch and return response using direct way", () => {
			cy.get("@postDevicesResponse")
				.then(async (fixture) => {
					const data = await config.api.subscribeDevice(
						config.pushToken,
						config.pushType,
						true,
						config.userAdditionalInformation,
						config.type,
						config.version,
						config.referer,
					);
					expect(JSON.stringify(data))
						.to
						.be
						.equal(JSON.stringify(fixture));
				});
		});

		it("should fetch and return response using ApiEventTarget", () => {
			cy.get("@postDevicesResponse")
				.then(async (fixture) => {
					return new Cypress.Promise((resolve) => {
						// Subscribe to the "subscribe" event
						ApiEventTarget.addEventListener(subscribe, (data) => {
							// Validate that the response from the API is correct
							expect(JSON.stringify(data.detail))
								.to
								.be
								.equal(JSON.stringify(fixture));
							resolve();
						});

						config.api.subscribeDevice(
							config.pushToken,
							config.pushType,
							true,
							config.userAdditionalInformation,
							config.type,
							config.version,
							config.referer,
						);
					});
				});
		});

		it("should set the deviceRegistered and isDeviceRegistrationPending correctly", () => {
			cy.visit("/");

			expect(config.api.isDeviceRegistrationPending)
				.to
				.be
				.equal(false);
			expect(config.api.deviceRegistered)
				.to
				.be
				.equal(false);

			// Intercept the devices call until we have confirmed that
			// the isDeviceRegistrationPending flag is correctly set
			const interception = interceptIndefinitely("POST", "*/**/devices");

			config.api.subscribeDevice(
				config.pushToken,
				config.pushType,
				true,
				config.userAdditionalInformation,
				config.type,
				config.version,
				config.referer,
			)
				.then(() => {
					expect(config.api.isDeviceRegistrationPending)
						.to
						.be
						.equal(false);
					expect(config.api.deviceRegistered)
						.to
						.be
						.equal(true);
				});

			expect(config.api.isDeviceRegistrationPending)
				.to
				.be
				.equal(true);

			interception.sendResponse();

			// eslint-disable-next-line cypress/no-unnecessary-waiting
			cy.wait(1000); // Wat for expectations from subscribeDevice.then, not sure how else i can do this...
		});
	});

	describe("sendMessage()", () => {
		filterPrimitives(["string"])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as message`, () => {
					expect(() => config.api.sendMessage(set.value))
						.to
						.throw(`Expected \`message\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		filterPrimitives([
			"string",
			"undefined",
		])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as referer`, () => {
					expect(() => config.api.sendMessage(
						config.message,
						set.value,
					))
						.to
						.throw(`Expected \`referer\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		it("should default referer to window.location.href", () => {
			cy.visit("/");

			config.api.sendMessage(config.message);

			cy.wait("@postMessages")
				.then((interception) => {
					cy.location("href")
						.then((href) => {
							expect(JSON.parse(interception.request.body).referer)
								.to
								.contain(href);

							// There is an issue where the window.location.href will contain "iframe/xxx"
							// due to how Cypress loads the chat, so we cannot check if the
							// href equals the href we get here
							// Instead we can only check if it begins with the href
							// Error when using `.equal(href)`
							// expected https://chat-dev.parley.nu:8181/__cypress/iframes/integration/api-class_spec.js to equal https://chat-dev.parley.nu:8181/
						});
				});
		});

		it("should fetch and return response using direct way", () => {
			cy.get("@postMessagesResponse")
				.then(async (fixture) => {
					const data = await config.api.sendMessage(config.message);
					expect(JSON.stringify(data))
						.to
						.be
						.equal(JSON.stringify(fixture));
				});
		});

		it("should fetch and return response using ApiEventTarget", () => {
			cy.get("@postMessagesResponse")
				.then(async (fixture) => {
					return new Cypress.Promise((resolve) => {
						// Subscribe to the "messagesent" event
						ApiEventTarget.addEventListener(messageSent, (data) => {
							// Validate that the response from the API is correct
							expect(JSON.stringify(data.detail))
								.to
								.be
								.equal(JSON.stringify(fixture));
							resolve();
						});

						config.api.sendMessage(config.message);
					});
				});
		});
	});

	describe("getMessages()", () => {
		filterPrimitives([
			"number", "undefined",
		])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as id`, () => {
					expect(() => config.api.getMessages(set.value))
						.to
						.throw(`Expected \`id\` to be of type \`number\` but received type \`${set.type}\``);
				});
			});

		filterPrimitives(["string"])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as filter when id is supplied`, () => {
					if(set.type === "string")
						// eslint-disable-next-line no-param-reassign
						set.value = "after";
					expect(() => config.api.getMessages(1, set.value))
						.to
						.throw(`Expected \`filter\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		filterPrimitives([
			"string", "undefined",
		])
			.forEach((set) => {
				if(set.type === "string")
					// eslint-disable-next-line no-param-reassign
					set.value = "after";
				it(`should throw an error when using '${set.type}' as filter when id is not supplied`, () => {
					expect(() => config.api.getMessages(undefined, set.value))
						.to
						.throw(`Expected \`filter\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		[
			{
				id: 1,
				filter: "before",
			},
			{
				id: 1,
				filter: "after",
			},
			{
				id: undefined,
				filter: undefined,
			},
		].forEach(({id, filter}) => {
			it(`should fetch and return response using direct way (with id ${id} and filter "${filter}")`, () => {
				cy.get("@getMessagesResponse")
					.then(async (fixture) => {
						const data = await config.api.getMessages(id, filter);
						expect(JSON.stringify(data))
							.to
							.be
							.equal(JSON.stringify(fixture));
					});
			});

			it(`should fetch and return response using ApiEventTarget (with id ${id} and filter "${filter}")`, () => {
				cy.get("@getMessagesResponse")
					.then(async (fixture) => {
						return new Cypress.Promise((resolve) => {
							// Subscribe to the "messages" event
							ApiEventTarget.addEventListener(messages, (data) => {
								// Validate that the response from the API is correct
								expect(JSON.stringify(data.detail))
									.to
									.be
									.equal(JSON.stringify(fixture));
								resolve();
							});

							config.api.getMessages(id, filter);
						});
					});
			});
		});
	});

	describe("fetchWrapper()", () => {
		it("should make a request with the default headers", () => {
			const defaultHeaders = {
				"x-iris-identification": `${config.accountIdentification}:${config.deviceIdentification}`,
				authorization: config.authorization,
			};

			config.api.setDeviceIdentification(config.deviceIdentification);
			config.api.setAuthorization(config.authorization);

			const testUrl = `${config.apiDomain}/**/devices`;
			const method = "POST";

			cy.wrap(config.api.fetchWrapper(testUrl, {method}));

			cy.wait("@postDevices")
				.then((interception) => {
					expect(Object.keys(interception.request.headers))
						.to
						.include
						.members(Object.keys(defaultHeaders));
					expect(Object.values(interception.request.headers))
						.to
						.include
						.members(Object.values(defaultHeaders));
				});
		});
		it("should make a request with custom headers", () => {
			const customHeaders = {
				"x-custom-1": "1",
				"x-custom-2": "2",
			};

			config.api.setCustomHeaders(customHeaders);

			config.api.subscribeDevice(
				config.pushToken,
				config.pushType,
				true,
				config.userAdditionalInformation,
				config.type,
				config.version,
				config.referer,
			);

			cy.wait("@postDevices")
				.then((interception) => {
					expect(Object.keys(interception.request.headers))
						.to
						.include
						.members(Object.keys(customHeaders));
					expect(Object.values(interception.request.headers))
						.to
						.include
						.members(Object.values(customHeaders));
				});
		});
	});

	describe("getMedia()", () => {
		filterPrimitives(["string"])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as year`, () => {
					expect(() => config.api.getMedia(set.value))
						.to
						.throw(`Expected \`year\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		filterPrimitives(["string"])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as month`, () => {
					expect(() => config.api.getMedia("2023", set.value))
						.to
						.throw(`Expected \`month\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		filterPrimitives(["string"])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as day`, () => {
					expect(() => config.api.getMedia("2023", "6", set.value))
						.to
						.throw(`Expected \`day\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		filterPrimitives(["string"])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as fileName`, () => {
					expect(() => config.api.getMedia("2023", "6", "6", set.value))
						.to
						.throw(`Expected \`fileName\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		it("should fetch and return response using direct way", () => {
			cy.get("@getMediaResponse")
				.then(async (fixture) => {
					const data = await config.api.getMedia("2023", "6", "6", "41cedb695613d417be10c65f089521599c103cc9.png");

					// `data` is a Blob and we need text so we can match it to the fixture
					const dataAsText = await data.text();

					// `fixture` is a buffer, so we need to convert it to a blob and then to text
					const fixtureAsText = await new Blob([fixture], {type: "image/png"}).text();

					expect(dataAsText)
						.to
						.be
						.equal(fixtureAsText);
				});
		});

		it("should fetch and return response using ApiEventTarget", () => {
			cy.get("@getMediaResponse")
				.then(async (fixture) => {
					return new Cypress.Promise((resolve) => {
						// Subscribe to the "messagesent" event
						ApiEventTarget.addEventListener(media, async (data) => {
							// Validate that the response from the API is correct

							// `data` is a Blob and we need text so we can match it to the fixture
							const dataAsText = await data.detail.text();

							// `fixture` is a buffer, so we need to convert it to a blob and then to text
							const fixtureAsText = await new Blob([fixture], {type: "image/png"}).text();

							expect(dataAsText)
								.to
								.be
								.equal(fixtureAsText);
							resolve();
						});

						config.api.getMedia("2023", "6", "6", "41cedb695613d417be10c65f089521599c103cc9.png");
					});
				});
		});
	});

	describe("uploadMedia()", () => {
		filterPrimitives(["Object"])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as file`, () => {
					expect(() => config.api.uploadMedia(set.value))
						.to
						.throw(`Expected \`file\` to be of type \`object\` but received type \`${set.type}\``);
				});
			});

		it(`should throw an error when using 'object' as file`, () => {
			expect(() => config.api.uploadMedia({}))
				.to
				.throw(`Expected object \`file\` \`{}\` to be of type \`File\``);
		});

		it("should fetch and return response using direct way", () => {
			cy.get("@postMediaResponse")
				.then(async (fixture) => {
					cy.get("@mediaFile")
						.then(async (mediaFile) => {
							const data = await config.api.uploadMedia(mediaFile);
							expect(JSON.stringify(data))
								.to
								.be
								.equal(JSON.stringify(fixture));
						});
				});
		});

		it("should fetch and return response using ApiEventTarget", () => {
			cy.get("@postMediaResponse")
				.then(async (fixture) => {
					cy.get("@mediaFile")
						.then(async (mediaFile) => {
							return new Cypress.Promise((resolve) => {
								// Subscribe to the "messagesent" event
								ApiEventTarget.addEventListener(mediaUploaded, (data) => {
									// Validate that the response from the API is correct
									expect(JSON.stringify(data.detail))
										.to
										.be
										.equal(JSON.stringify(fixture));
									resolve();
								});

								config.api.uploadMedia(mediaFile);
							});
						});
				});
		});
	});

	describe("sendMedia()", () => {
		filterPrimitives(["string"])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as mediaId`, () => {
					expect(() => config.api.sendMedia(set.value, "pdf.pdf"))
						.to
						.throw(`Expected \`mediaId\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		filterPrimitives(["string"])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as fileName`, () => {
					expect(() => config.api.sendMedia("67eb4e69-b086-4654-b15e-bc606f3ea56b", set.value))
						.to
						.throw(`Expected \`fileName\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		filterPrimitives([
			"string",
			"undefined",
		])
			.forEach((set) => {
				it(`should throw an error when using '${set.type}' as referer`, () => {
					expect(() => config.api.sendMedia("67eb4e69-b086-4654-b15e-bc606f3ea56b", "pdf.pdf", set.value))
						.to
						.throw(`Expected \`referer\` to be of type \`string\` but received type \`${set.type}\``);
				});
			});

		it("should default referer to window.location.href", () => {
			cy.visit("/");

			config.api.sendMedia("67eb4e69-b086-4654-b15e-bc606f3ea56b", "pdf.pdf");

			cy.wait("@postMessages")
				.then((interception) => {
					cy.location("href")
						.then((href) => {
							expect(JSON.parse(interception.request.body).referer)
								.to
								.contain(href);

							// There is an issue where the window.location.href will contain "iframe/xxx"
							// due to how Cypress loads the chat, so we cannot check if the
							// href equals the href we get here
							// Instead we can only check if it begins with the href
							// Error when using `.equal(href)`
							// expected https://chat-dev.parley.nu:8181/__cypress/iframes/integration/api-class_spec.js to equal https://chat-dev.parley.nu:8181/
						});
				});
		});

		it("should fetch and return response using direct way", () => {
			cy.get("@postMessagesResponse")
				.then(async (fixture) => {
					const data = await config.api.sendMedia("67eb4e69-b086-4654-b15e-bc606f3ea56b", "pdf.pdf");
					expect(JSON.stringify(data))
						.to
						.be
						.equal(JSON.stringify(fixture));
				});
		});

		it("should fetch and return response using ApiEventTarget", () => {
			cy.get("@postMessagesResponse")
				.then(async (fixture) => {
					return new Cypress.Promise((resolve) => {
						// Subscribe to the "messagesent" event
						ApiEventTarget.addEventListener(messageSent, (data) => {
							// Validate that the response from the API is correct
							expect(JSON.stringify(data.detail))
								.to
								.be
								.equal(JSON.stringify(fixture));
							resolve();
						});

						config.api.sendMedia("67eb4e69-b086-4654-b15e-bc606f3ea56b", "pdf.pdf");
					});
				});
		});
	});
});
