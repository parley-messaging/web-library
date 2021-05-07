import Config from "./Config";
import ApiResponseEvent from "./ApiResponseEvent";

export default class Api extends EventTarget {
	constructor(apiDomain) {
		super();
		this.setDomain(apiDomain);
		this.events = {
			onSubscribe: "onSubscribe",
			onSendMessage: "onSendMessage",
			onGetMessages: "onGetMessages",
		};
	}

	// TODO: Use localStorage for identifications

	setDomain(apiDomain) {
		this.config = new Config(apiDomain);
	}

	subscribeDevice(accountIdentification, deviceIdentification) {
		fetch(`${this.config.apiUrl}/devices`, {
			method: "POST",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
		})
			.then(response => response.json())
			.then((data) => {
				this.dispatchEvent(new ApiResponseEvent("onSubscribe", data));
			})
			.catch((error) => {
				// TODO: These errors are not 4xx statuses, so what should we do with them?
				console.error(`Error occured during Fetch()`, error);
			});
	}

	sendMessage(message, accountIdentification, deviceIdentification) {
		fetch(`${this.config.apiUrl}/messages`, {
			method: "POST",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
			body: JSON.stringify({message}),
		})
			.then(response => response.json())
			.then((data) => {
				this.dispatchEvent(new ApiResponseEvent("onSendMessage", data));
			})
			.catch((error) => {
				// TODO: These errors are not 4xx statuses, so what should we do with them?
				console.error(`Error occured during Fetch()`, error);
			});
	}

	getMessages(accountIdentification, deviceIdentification) {
		fetch(`${this.config.apiUrl}/messages`, {
			method: "GET",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
		})
			.then(response => response.json())
			.then((data) => {
				this.dispatchEvent(new ApiResponseEvent("onGetMessages", data));
			})
			.catch((error) => {
				// TODO: These errors are not 4xx statuses, so what should we do with them?
				console.error(`Error occured during Fetch()`, error);
			});
	}
}
