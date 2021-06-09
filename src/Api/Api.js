// This script contains wrapper functions for making API calls
// You can use this script on it's own or you can make use of the
// event based implementation in Api.js

import Config from "./Private/Config";
import PrivateFunctions from "./Private/PrivateFunctions";
import ow from "ow";
import {
	DeviceTypesAsArray,
	DeviceVersionMaxLength,
	DeviceVersionMinLength, DeviceVersionRegex, Events,
	MinUdidLength,
	PushTypesAsArray,
} from "./Constants";
import ApiResponseEvent from "./Private/ApiResponseEvent";

export default class Api {
	constructor(apiDomain, apiEventTarget) {
		ow(apiDomain, "apiDomain", ow.string.nonEmpty);
		ow(apiEventTarget, "apiEventTarget", ow.object.instanceOf(EventTarget));

		this.setDomain(apiDomain);
		this.eventTarget = apiEventTarget;
	}

	setDomain(apiDomain) {
		ow(apiDomain, "apiDomain", ow.string.nonEmpty);

		this.config = new Config(apiDomain);
	}

	getEventTarget() {
		return this.eventTarget;
	}

	subscribeDevice(
		accountIdentification,
		deviceIdentification,
		pushToken,
		pushType,
		pushEnabled,
		userAdditionalInformation,
		type,
		version,
		referer,
	) {
		ow(accountIdentification, "accountIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.minLength(MinUdidLength));

		// Validate optional params
		ow(pushToken, "pushToken", ow.optional.string.nonEmpty);
		ow(pushType, "pushType", ow.optional.number.oneOf(PushTypesAsArray));
		ow(pushEnabled, "pushEnabled", ow.optional.boolean);
		ow(userAdditionalInformation, "userAdditionalInformation", ow.optional.object.nonEmpty);
		ow(type, "type", ow.optional.number.oneOf(DeviceTypesAsArray));
		ow(version, "version", ow.optional.string.minLength(DeviceVersionMinLength));
		ow(version, "version", ow.optional.string.maxLength(DeviceVersionMaxLength));
		ow(version, "version", ow.optional.string.matches(DeviceVersionRegex));
		ow(referer, "referer", ow.optional.string.nonEmpty);

		return PrivateFunctions.fetchWrapper(`${this.config.apiUrl}/devices`, {
			method: "POST",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
			body: JSON.stringify({
				pushToken,
				pushType,
				pushEnabled,
				userAdditionalInformation,
				type,
				version,
				referer,
			}),
		})
			.then((data) => {
				this.eventTarget.dispatchEvent(new ApiResponseEvent(Events.onSubscribe, data));
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
		})
			.then((data) => {
				this.eventTarget.dispatchEvent(new ApiResponseEvent(Events.onSendMessage, data));
			});
	}

	getMessages(accountIdentification, deviceIdentification) {
		ow(accountIdentification, "accountIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.minLength(MinUdidLength));

		return PrivateFunctions.fetchWrapper(`${this.config.apiUrl}/messages`, {
			method: "GET",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
		})
			.then((data) => {
				this.eventTarget.dispatchEvent(new ApiResponseEvent(Events.onGetMessages, data));
			});
	}
}
