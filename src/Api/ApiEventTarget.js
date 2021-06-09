// This script is an event based implementation of the Api.js script.
// It provides subscribable events which get fired upon response of the API.
// This way you can listen for responses on multiple locations.

import ApiResponseEvent from "./Private/ApiResponseEvent";
import Api from "./Api";
import ow from "ow";
import {MinUdidLength} from "./Private/Constants";

export default class ApiEventTarget extends EventTarget {
	constructor(apiDomain) {
		ow(apiDomain, "apiDomain", ow.string.nonEmpty);

		super();
		this.Api = new Api(apiDomain);
		this.events = {
			onSubscribe: "onSubscribe",
			onSendMessage: "onSendMessage",
			onGetMessages: "onGetMessages",
		};
	}

	subscribeDevice(accountIdentification, deviceIdentification) {
		ow(accountIdentification, "accountIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.minLength(MinUdidLength));

		return this.Api.subscribeDevice(accountIdentification, deviceIdentification)
			.then((data) => {
				this.dispatchEvent(new ApiResponseEvent("onSubscribe", data));
			});
	}

	sendMessage(message, accountIdentification, deviceIdentification) {
		ow(message, "message", ow.string.nonEmpty);
		ow(accountIdentification, "accountIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.minLength(MinUdidLength));

		return this.Api.sendMessage(message, accountIdentification, deviceIdentification)
			.then((data) => {
				this.dispatchEvent(new ApiResponseEvent("onSendMessage", data));
			});
	}

	getMessages(accountIdentification, deviceIdentification) {
		ow(accountIdentification, "accountIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.minLength(MinUdidLength));

		return this.Api.getMessages(accountIdentification, deviceIdentification)
			.then((data) => {
				this.dispatchEvent(new ApiResponseEvent("onGetMessages", data));
			});
	}
}
