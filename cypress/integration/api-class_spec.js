import Api from "../../src/Api/Api";
import ApiEventTarget from "../../src/Api/ApiEventTarget";
import Config from "../../src/Api/Private/Config";
import {subscribe} from "../../src/Api/Constants/Events";
import {FCMWeb} from "../../src/Api/Constants/PushTypes";
import {Web} from "../../src/Api/Constants/DeviceTypes";

const config = {
	apiDomain: "https://fake.parley.nu",
	accountIdentification: "0W4qcE5aXoKq9OzvHxj2",
	deviceIdentification: "weblib-v2_cypress-test",
	pushToken: "weblib-v2_cypress-test+pushToken",
	pushType: FCMWeb,
	userAdditionalInformation: {name: "weblib-v2_cypress-test"},
	type: Web,
};
const staticDevicesResponse = {
	data: {},
	notifications: [
		{
			type: "success",
			message: "device_successfully_subscribed",
		},
	],
	status: "SUCCESS",
	metadata: {
		values: {url: "devices"},
		method: "post",
		duration: 0.01,
	},
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
		config.api = new Api(
			config.apiDomain,
			config.accountIdentification,
			config.deviceIdentification,
			ApiEventTarget,
		);

		// Intercept api calls and respond with a static response
		// This way we don't fill up the API with test data
		cy.intercept(`${config.apiDomain}/**/devices`, staticDevicesResponse);
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

	describe("subscribeDevice()", () => {
		it("should throw an error when using something other than a String as pushToken", () => {
			filterPrimitives([
				"string",
				"undefined", // Dont test for undefined, because pushToken is optional and if we give undefined it will test for `version` next
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(set.value))
					.to.throw(`Expected \`pushToken\` to be of type \`string\` but received type \`${set.type}\``);
			});
		});

		it("should throw an error when using something other than a Number as pushType", () => {
			filterPrimitives([
				"number",
				"undefined", // Dont test for undefined, because pushType is optional and if we give undefined it will test for `version` next
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(config.pushToken, set.value))
					.to.throw(`Expected \`pushType\` to be of type \`number\` but received type \`${set.type}\``);
			});
		});

		it("should throw an error when using invalid pushType", () => {
			const pushType = 9999;
			expect(() => config.api.subscribeDevice(config.pushToken, pushType))
				.to.throw(`Expected number \`pushType\` to be one of \`[1,2,3,4,5,6]\`, got ${pushType}`);
		});

		it("should throw an error when using something other than a Boolean as pushEnabled", () => {
			filterPrimitives([
				"boolean",
				"undefined", // Dont test for undefined, because pushEnabled is optional and if we give undefined it will test for `verison` next
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(config.pushToken, config.pushType, set.value))
					.to.throw(`Expected \`pushEnabled\` to be of type \`boolean\` but received type \`${set.type}\``);
			});
		});

		it("should throw an error when using `pushEnabled = true` and something other than a String as pushToken", () => {
			filterPrimitives([
				"string",
				"undefined", // Dont test for undefined, because pushToken is optional and if we give undefined it will test for `verison` next
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(set.value, config.pushType, true))
					.to.throw(`Expected \`pushToken\` to be of type \`string\` but received type \`${set.type}\``);
			});
		});

		it("should throw an error when using something other than an Object as userAdditionalInformation", () => {
			filterPrimitives([
				"Object",
				"undefined", // Dont test for undefined, because userAdditionalInformation is optional and if we give undefined it will test for `verison` next
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(config.pushToken, config.pushType, true, set.value))
					.to.throw(`Expected \`userAdditionalInformation\` to be of type \`object\` but received type \`${set.type}\``);
			});
		});

		it("should throw an error when using something other than a Number as type", () => {
			filterPrimitives([
				"number",
				"boolean", // Boolean are numbers
				"undefined", // Dont test for undefined, because type is optional and if we give undefined it will test for `verison` next
			]).forEach((set) => {
				expect(() => config.api.subscribeDevice(
					config.pushToken,
					config.pushType,
					true,
					config.userAdditionalInformation,
					set.value,
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
				))
					.to.throw(`Expected \`version\` to be of type \`string\` but received type \`${set.type}\``);
			});
		});

		it("should throw an error when using invalid version", () => {
			// TODO: Min length
			// TODO: Max length
			// TODO: Regex
		});

		// TODO: Test referer

		it("should fetch and return response using direct way", () => {
			return config.api.subscribeDevice(undefined, undefined, undefined, undefined, undefined, "1.0.0", undefined)
				.then((data) => {
					expect(JSON.stringify(data)).to.be.equal(JSON.stringify(staticDevicesResponse));
				});
		});

		it("should fetch and return response using ApiEventTarget", () => {
			ApiEventTarget.addEventListener(subscribe, (data) => {
				expect(JSON.stringify(data.detail)).to.be.equal(JSON.stringify(staticDevicesResponse));
			});
			config.api.subscribeDevice(undefined, undefined, undefined, undefined, undefined, "1.0.0", undefined);
		});
	});
});
