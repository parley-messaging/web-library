import Api from "../../src/Api/Api";
import ApiEventTarget from "../../src/Api/ApiEventTarget";
import Config from "../../src/Api/Private/Config";
import {messageSent, subscribe} from "../../src/Api/Constants/Events";
import {FCMWeb} from "../../src/Api/Constants/PushTypes";
import {Web} from "../../src/Api/Constants/DeviceTypes";
import {DeviceVersionRegex} from "../../src/Api/Constants/Other";
import {CUSTOMHEADER_BLACKLIST} from "../../src/Api/Constants/CustomHeaderBlacklist";

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
		type: "bigint",
		value: 2n,
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
		cy.fixture("postDevicesResponse.json").as("postDevicesResponse");
		cy.fixture("postMessagesResponse.json").as("postMessagesResponse");
		cy.get("@postDevicesResponse").then((json) => {
			cy.intercept("POST", `${config.apiDomain}/**/devices`, json).as("postDevices");
		});
		cy.get("@postMessagesResponse").then((json) => {
			cy.intercept("POST", `${config.apiDomain}/**/messages`, json).as("postMessages");
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
			expect(config.api.config).to.be.instanceOf(Config);
			expect(config.api.config.apiDomain).to.be.equal(config.apiDomain);
			expect(config.api.accountIdentification).to.be.equal(config.accountIdentification);
			expect(config.api.deviceIdentification).to.be.equal(config.deviceIdentification);
			expect(config.api.eventTarget).to.be.equal(ApiEventTarget);
		});
		it("should throw an error when using something other than a EventTarget as apiEventTarget", () => {
			expect(() => new Api(config.apiDomain, config.accountIdentification, config.deviceIdentification, {}))
				.to.throw("Expected object `apiEventTarget` `{}` to be of type `EventTarget`");
		});
	});

	describe("setDomain()", () => {
		it("should change the apiDomain", () => {
			const newDomain = "someotherdomain";
			config.api.setDomain(newDomain);

			expect(config.api.config.apiDomain).to.be.equal(newDomain);
		});
		it("should throw an error when using something other than a String as domain", () => {
			filterPrimitives(["string"]).forEach((set) => {
				expect(() => config.api.setDomain(set.value))
					.to.throw(`Expected \`apiDomain\` to be of type \`string\` but received type \`${set.type}\``);
			});
		});
		it("should throw an error when using an Empty string as domain", () => {
			expect(() => config.api.setDomain(""))
				.to.throw("Expected string `apiDomain` to not be empty");
		});
	});

	describe("setAccountIdentification()", () => {
		it("should change the accountIdentification", () => {
			const newAccountIdentification = "someotheraccountidentfication";
			config.api.setAccountIdentification(newAccountIdentification);

			expect(config.api.accountIdentification).to.be.equal(newAccountIdentification);
		});
		it("should throw an error when using something other than a String as accountIdentification", () => {
			filterPrimitives(["string"]).forEach((set) => {
				expect(() => config.api.setAccountIdentification(set.value))
					.to.throw(`Expected \`accountIdentification\` to be of type \`string\` but received type \`${set.type}\``);
			});
		});
		it("should throw an error when using an Empty string as accountIdentification", () => {
			expect(() => config.api.setAccountIdentification(""))
				.to.throw("Expected string `accountIdentification` to not be empty");
		});
	});

	describe("setDeviceIdentification()", () => {
		it("should change the deviceIdentification", () => {
			const newDeviceIdentification = "someotherdeviceidentfication";
			config.api.setDeviceIdentification(newDeviceIdentification);

			expect(config.api.deviceIdentification).to.be.equal(newDeviceIdentification);
		});
		it("should throw an error when using something other than a String as deviceIdentification", () => {
			filterPrimitives(["string"]).forEach((set) => {
				expect(() => config.api.setDeviceIdentification(set.value))
					.to.throw(`Expected \`deviceIdentification\` to be of type \`string\` but received type \`${set.type}\``);
			});
		});
		it("should throw an error when using an Empty string as deviceIdentification", () => {
			expect(() => config.api.setDeviceIdentification(""))
				.to.throw("Expected string `deviceIdentification` to not be empty");
		});
		it("should throw an error when using a short string as deviceIdentification", () => {
			// Min length is 10
			const identification = "aaaaaaaaa";
			expect(() => config.api.setDeviceIdentification(identification))
				.to.throw(`Expected string \`deviceIdentification\` to have a minimum length of \`10\`, got \`${identification}\``);
		});
	});

	describe("setCustomHeaders()", () => {
		it("should change the customHeaders", () => {
			const newCustomHeaders = {
				"x-custom-1": "1",
				"x-custom-2": "2",
			};
			config.api.setCustomHeaders(newCustomHeaders);

			expect(config.api.customHeaders).to.be.equal(newCustomHeaders);
		});
		it("should throw an error when using something other than an Object as customHeaders", () => {
			filterPrimitives([
				"Object", "undefined", "null", "boolean",
			]).forEach((set) => {
				expect(() => config.api.setCustomHeaders(set.value))
					.to.throw(`Expected \`customHeaders\` to be of type \`object\` but received type \`${set.type}\``);
			});
		});

		it("should throw an error when using a blacklisted header as one of the custom headers", () => {
			CUSTOMHEADER_BLACKLIST.forEach((blacklistedHeaderKey) => {
				expect(() => config.api.setCustomHeaders({[blacklistedHeaderKey]: "some value"}))
					.to.throw(`(string \`${blacklistedHeaderKey}\`) This is a blacklisted header, please use a different header name`);
			});
		});

		it("should throw an error when using a 'reserved' prefix for one of the custom headers", () => {
			let reservedPrefixKey = "x-parley-test";
			let newCustomHeaders = {[reservedPrefixKey]: "some value"};

			expect(() => config.api.setCustomHeaders(newCustomHeaders))
				.to.throw(`Expected string \`${reservedPrefixKey}\` to not start with \`x-parley-\`, got \`${reservedPrefixKey}\``);

			reservedPrefixKey = "x-iris-test";
			newCustomHeaders = {[reservedPrefixKey]: "some value"};

			expect(() => config.api.setCustomHeaders(newCustomHeaders))
				.to.throw(`Expected string \`${reservedPrefixKey}\` to not start with \`x-iris-\`, got \`${reservedPrefixKey}\``);
		});
	});

	describe("subscribeDevice()", () => {
		it("should throw an error when using something other than a String as pushToken", () => {
			filterPrimitives([
				"string",
				"undefined", // Don't test for undefined, because pushToken is optional and if we give undefined it will test for `version` next
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(
					set.value,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				))
					.to.throw(`Expected \`pushToken\` to be of type \`string\` but received type \`${set.type}\``);
			});
		});

		it("should throw an error when using something other than a Number as pushType", () => {
			filterPrimitives([
				"number",
				"undefined", // Don't test for undefined, because pushType is optional and if we give undefined it will test for `version` next
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(
					config.pushToken,
					set.value,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				))
					.to.throw(`Expected \`pushType\` to be of type \`number\` but received type \`${set.type}\``);
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
				undefined,
			))
				.to.throw(`Expected number \`pushType\` to be one of \`[1,2,3,4,5,6]\`, got ${pushType}`);
		});

		it("should throw an error when using something other than a Boolean as pushEnabled", () => {
			filterPrimitives([
				"boolean",
				"undefined", // Don't test for undefined, because pushEnabled is optional and if we give undefined it will test for `version` next
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(
					config.pushToken,
					config.pushType,
					set.value,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				))
					.to.throw(`Expected \`pushEnabled\` to be of type \`boolean\` but received type \`${set.type}\``);
			});
		});

		it("should throw an error when using `pushEnabled = true` and something other than a String as pushToken", () => {
			filterPrimitives([
				"string",
				"undefined", // Don't test for undefined, because pushToken is optional and if we give undefined it will test for `version` next
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(
					set.value,
					config.pushType,
					true,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				))
					.to.throw(`Expected \`pushToken\` to be of type \`string\` but received type \`${set.type}\``);
			});
		});

		it("should throw an error when using something other than an Object as userAdditionalInformation", () => {
			filterPrimitives([
				"Object",
				"undefined", // Don't test for undefined, because userAdditionalInformation is optional and if we give undefined it will test for `version` next
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(
					config.pushToken,
					config.pushType,
					true,
					set.value,
					undefined,
					undefined,
					undefined,
					undefined,
				))
					.to.throw(`Expected \`userAdditionalInformation\` to be of type \`object\` but received type \`${set.type}\``);
			});
		});

		it("should throw an error when using something other than a Number as type", () => {
			filterPrimitives([
				"number",
				"boolean", // Boolean are numbers
				"undefined", // Don't test for undefined, because type is optional and if we give undefined it will test for `version` next
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(
					config.pushToken,
					config.pushType,
					true,
					config.userAdditionalInformation,
					set.value,
					undefined,
					undefined,
					undefined,
				))
					.to.throw(`Expected \`type\` to be of type \`number\` but received type \`${set.type}\``);
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
				undefined,
			))
				.to.throw(`Expected number \`type\` to be one of \`[1,2,3,4]\`, got ${type}`);
		});

		it("should throw an error when using something other than a String as version", () => {
			filterPrimitives(["string"]).forEach((set) => {
				expect(() => config.api.subscribeDevice(
					config.pushToken,
					config.pushType,
					true,
					config.userAdditionalInformation,
					config.type,
					set.value,
					undefined,
					undefined,
				))
					.to.throw(`Expected \`version\` to be of type \`string\` but received type \`${set.type}\``);
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
				config.authorization,
			))
				.to.throw(`Expected string \`version\` to have a minimum length of \`5\`, got \`${shortVersion}\``);

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
				config.authorization,
			))
				.to.throw(`Expected string \`version\` to have a maximum length of \`8\`, got \`${longVersion}\``);

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
				config.authorization,
			))
				.to.throw(`Expected string \`version\` to match \`${DeviceVersionRegex}\`, got \`${wrongFormat}\``);
		});

		it("should throw an error when using something other than a String as referer", () => {
			filterPrimitives([
				"string",
				"undefined",
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(
					config.pushToken,
					config.pushType,
					true,
					config.userAdditionalInformation,
					config.type,
					config.version,
					set.value,
					config.authorization,
				))
					.to.throw(`Expected \`referer\` to be of type \`string\` but received type \`${set.type}\``);
			});
		});

		it("should throw an error when using something other than a String as authorization", () => {
			filterPrimitives([
				"string",
				"undefined", // Don't test for undefined, because authorization is optional and if we give undefined it will test for other params next
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(
					config.pushToken,
					config.pushType,
					true,
					config.userAdditionalInformation,
					config.type,
					config.version,
					config.referer,
					set.value,
				))
					.to.throw(`Expected \`authorization\` to be of type \`string\` but received type \`${set.type}\``);
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
				undefined,
			);

			cy.wait("@postDevices").then((interception) => {
				cy.location("href").then((href) => {
					expect(JSON.parse(interception.request.body).referer)
						.to.contain(href);

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
						config.authorization,
					);
					expect(JSON.stringify(data)).to.be.equal(JSON.stringify(fixture));
				});
		});

		it("should fetch and return response using ApiEventTarget", () => {
			cy.get("@postDevicesResponse")
				.then(async (fixture) => {
					return new Cypress.Promise((resolve) => {
						// Subscribe to the "subscribe" event
						ApiEventTarget.addEventListener(subscribe, (data) => {
							// Validate that the response from the API is correct
							expect(JSON.stringify(data.detail)).to.be.equal(JSON.stringify(fixture));
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
							config.authorization,
						);
					});
				});
		});
	});

	describe("sendMessage()", () => {
		it("should throw an error when using something other than a String as message", () => {
			filterPrimitives(["string"]).forEach((set) => {
				expect(() => config.api.sendMessage(set.value))
					.to.throw(`Expected \`message\` to be of type \`string\` but received type \`${set.type}\``);
			});
		});

		it("should throw an error when using something other than a String as referer", () => {
			filterPrimitives([
				"string",
				"undefined",
			]).forEach((set) => {
				expect(() => config.api.sendMessage(
					config.message,
					set.value,
				))
					.to.throw(`Expected \`referer\` to be of type \`string\` but received type \`${set.type}\``);
			});
		});

		it("should default referer to window.location.href", () => {
			cy.visit("/");

			config.api.sendMessage(config.message);

			cy.wait("@postMessages").then((interception) => {
				cy.location("href").then((href) => {
					expect(JSON.parse(interception.request.body).referer)
						.to.contain(href);

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
					expect(JSON.stringify(data)).to.be.equal(JSON.stringify(fixture));
				});
		});

		it("should fetch and return response using ApiEventTarget", () => {
			cy.get("@postMessagesResponse")
				.then(async (fixture) => {
					return new Cypress.Promise((resolve) => {
						// Subscribe to the "messagesent" event
						ApiEventTarget.addEventListener(messageSent, (data) => {
							// Validate that the response from the API is correct
							expect(JSON.stringify(data.detail)).to.be.equal(JSON.stringify(fixture));
							resolve();
						});

						config.api.sendMessage(config.message);
					});
				});
		});
	});

	describe("fetchWrapper()", () => {
		it("should make a request with custom headers", () => {
			const customHeaders = {
				"x-custom-1": "1",
				"x-custom-2": "2",
			};
			const url = `${config.apiDomain}/clientApi/vx.x/devices`;

			config.api.setCustomHeaders(customHeaders);

			config.api.fetchWrapper(url, {method: "POST"});

			cy.wait("@postDevices").then((interception) => {
				expect(Object.keys(interception.request.headers)).to.include.members(Object.keys(customHeaders));
				expect(Object.values(interception.request.headers)).to.include.members(Object.values(customHeaders));
			});
		});
	});
});
