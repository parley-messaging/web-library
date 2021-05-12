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
		});
	}

	sendMessage(message, accountIdentification, deviceIdentification) {
		return fetch(`${this.config.apiUrl}/messages`, {
			method: "POST",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
			body: JSON.stringify({message}),
		});
	}

	getMessages(accountIdentification, deviceIdentification) {
		return fetch(`${this.config.apiUrl}/messages`, {
			method: "GET",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
		});
	}
}
