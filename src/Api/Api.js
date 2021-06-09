// This script contains wrapper functions for making API calls
// You can use this script on it's own or you can make use of the
// event based implementation in ApiEventTarget.js

import Config from "./Private/Config";
import PrivateFunctions from "./Private/PrivateFunctions";
import ow from "ow";
import {MinUdidLength} from "./Private/Constants";

export default class Api {
	constructor(apiDomain) {
		ow(apiDomain, "apiDomain", ow.string.nonEmpty);

		this.setDomain(apiDomain);
	}

	setDomain(apiDomain) {
		ow(apiDomain, "apiDomain", ow.string.nonEmpty);

		this.config = new Config(apiDomain);
	}

	subscribeDevice(accountIdentification, deviceIdentification) {
		ow(accountIdentification, "accountIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.minLength(MinUdidLength));

		return PrivateFunctions.fetchWrapper(`${this.config.apiUrl}/devices`, {
			method: "POST",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
		});
	}

	sendMessage(message, accountIdentification, deviceIdentification) {
		ow(message, "message", ow.string.nonEmpty);
		ow(accountIdentification, "accountIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.minLength(MinUdidLength));

		return PrivateFunctions.fetchWrapper(`${this.config.apiUrl}/messages`, {
			method: "POST",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
			body: JSON.stringify({message}),
		});
	}

	getMessages(accountIdentification, deviceIdentification) {
		ow(accountIdentification, "accountIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.minLength(MinUdidLength));

		return PrivateFunctions.fetchWrapper(`${this.config.apiUrl}/messages`, {
			method: "GET",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
		});
	}
}
