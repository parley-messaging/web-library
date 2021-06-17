import Api from "../../src/Api/Api";
import ApiEventTarget from "../../src/Api/ApiEventTarget";
import Config from "../../src/Api/Private/Config";

const config = {
	apiDomain: "https://api.parley.nu",
	accountIdentification: "0W4qcE5aXoKq9OzvHxj2",
	deviceIdentification: "weblib-v2_cypress-test",
};

describe("Api class", () => {
	beforeEach(() => {
		config.api = new Api(
			config.apiDomain,
			config.accountIdentification,
			config.deviceIdentification,
			ApiEventTarget,
		);
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
			// Test for Integer
			expect(() => config.api.setDomain(1234))
				.to.throw("Expected `apiDomain` to be of type `string` but received type `number`");

			// Test for Object
			expect(() => config.api.setDomain({}))
				.to.throw("Expected `apiDomain` to be of type `string` but received type `Object`");
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
			// Test for Integer
			expect(() => config.api.setAccountIdentification(1234))
				.to.throw("Expected `accountIdentification` to be of type `string` but received type `number`");

			// Test for Object
			expect(() => config.api.setAccountIdentification({}))
				.to.throw("Expected `accountIdentification` to be of type `string` but received type `Object`");
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
			// Test for Integer
			expect(() => config.api.setDeviceIdentification(1234))
				.to.throw("Expected `deviceIdentification` to be of type `string` but received type `number`");

			// Test for Object
			expect(() => config.api.setDeviceIdentification({}))
				.to.throw("Expected `deviceIdentification` to be of type `string` but received type `Object`");
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
});
