/*
 * This script is an event based implementation of the Api.js script.
 * It provides subscribable events which get fired upon response of the API.
 * This way you can listen for responses on multiple locations.
 */

import ApiResponseEvent from "./ApiResponseEvent";
import Api from "./Api";

export default class ApiEventTarget extends EventTarget {
	constructor(apiDomain) {
		super();
		this.Api = new Api(apiDomain);
		this.events = {
			onSubscribe: "onSubscribe",
			onSendMessage: "onSendMessage",
			onGetMessages: "onGetMessages",
		};
	}

	// TODO: Use localStorage for identifications

	subscribeDevice(accountIdentification, deviceIdentification) {
		this.Api.subscribeDevice(accountIdentification, deviceIdentification)
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
		this.Api.sendMessage(message, accountIdentification, deviceIdentification)
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
		this.Api.getMessages(accountIdentification, deviceIdentification)
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
