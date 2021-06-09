// This script is an event based implementation of the Api.js script.
// It provides subscribable events which get fired upon response of the API.
// This way you can listen for responses on multiple locations.

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

	subscribeDevice(accountIdentification, deviceIdentification) {
		return this.Api.subscribeDevice(accountIdentification, deviceIdentification)
			.then((data) => {
				this.dispatchEvent(new ApiResponseEvent("onSubscribe", data));
			});
	}

	sendMessage(message, accountIdentification, deviceIdentification) {
		return this.Api.sendMessage(message, accountIdentification, deviceIdentification)
			.then((data) => {
				this.dispatchEvent(new ApiResponseEvent("onSendMessage", data));
			});
	}

	getMessages(accountIdentification, deviceIdentification) {
		return this.Api.getMessages(accountIdentification, deviceIdentification)
			.then((data) => {
				this.dispatchEvent(new ApiResponseEvent("onGetMessages", data));
			});
	}
}
