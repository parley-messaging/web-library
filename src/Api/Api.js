// This script contains wrapper functions for making API calls
// You can use this script on it's own or you can make use of the
// event based implementation in ApiEventTarget.js

import Config from "./Config";
import PrivateFunctions from "./PrivateFunctions";

export default class Api {
	constructor(apiDomain) {
		this.setDomain(apiDomain);
	}

	setDomain(apiDomain) {
		this.config = new Config(apiDomain);
	}

	subscribeDevice(accountIdentification, deviceIdentification) {
		return PrivateFunctions.fetchWrapper(`${this.config.apiUrl}/devices`, {
			method: "POST",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
		});
	}

	sendMessage(message, accountIdentification, deviceIdentification) {
		return PrivateFunctions.fetchWrapper(`${this.config.apiUrl}/messages`, {
			method: "POST",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
			body: JSON.stringify({message}),
		});
	}

	getMessages(accountIdentification, deviceIdentification) {
		return PrivateFunctions.fetchWrapper(`${this.config.apiUrl}/messages`, {
			method: "GET",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
		});
	}
}
