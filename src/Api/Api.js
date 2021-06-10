// This script contains wrapper functions for making API calls
// You can use this script on it's own or you can make use of the
// event based implementation in ApiEventTarget.js

import Config from "./Config";

export default class Api {
	constructor(apiDomain) {
		this.setDomain(apiDomain);
	}

	setDomain(apiDomain) {
		this.config = new Config(apiDomain);
	}

	subscribeDevice(accountIdentification, deviceIdentification) {
		return fetch(`${this.config.apiUrl}/devices`, {
			method: "POST",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
			body: JSON.stringify({referer: window.location.href}),
		});
	}

	sendMessage(message, accountIdentification, deviceIdentification) {
		return fetch(`${this.config.apiUrl}/messages`, {
			method: "POST",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
			body: JSON.stringify({
				referer: window.location.href,
				message,
			}),
		});
	}

	getMessages(accountIdentification, deviceIdentification) {
		return fetch(`${this.config.apiUrl}/messages`, {
			method: "GET",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
		});
	}
}
