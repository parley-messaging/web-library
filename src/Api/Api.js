// This script contains wrapper functions for making API calls
// You can use this script in a couple ways:
// - `const api = new Api(x)`, this way you can make API calls and handle the returned Promises yourself
// - `const api = new Api(x, ApiEventTarget)`, this will trigger events upon completion of some of the Promises
//    You can use `ApiEventTarget.addEventListener()` to listen for events.

import Config from "./Private/Config";
import ow from "ow";
import {
	ApiFetchFailed,
	ApiGenericError,
	DeviceVersionMaxLength,
	DeviceVersionMinLength, DeviceVersionRegex,
	MinUdidLength,
} from "./Constants/Other";
import ApiResponseEvent from "./Private/ApiResponseEvent";
import {onGetMessages, onSendMessage, onSubscribe} from "./Constants/Events";
import {AllPushTypes} from "./Constants/PushTypes";
import {AllDeviceTypes} from "./Constants/DeviceTypes";
import {error as ApiResponseNotificationTypeError} from "./Constants/ApiResponseNotificationTypes";
import {error as ApiResponseStatusTypeError} from "./Constants/ApiResponseStatuses";


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
		ow(pushType, "pushType", ow.optional.number.oneOf(Object.values(AllPushTypes)));
		ow(pushEnabled, "pushEnabled", ow.optional.boolean);
		ow(userAdditionalInformation, "userAdditionalInformation", ow.optional.object.nonEmpty);
		ow(type, "type", ow.optional.number.oneOf(Object.values(AllDeviceTypes)));
		ow(version, "version", ow.optional.string.minLength(DeviceVersionMinLength));
		ow(version, "version", ow.optional.string.maxLength(DeviceVersionMaxLength));
		ow(version, "version", ow.optional.string.matches(DeviceVersionRegex));
		ow(referer, "referer", ow.optional.string.nonEmpty);

		return fetchWrapper(`${this.config.apiUrl}/devices`, {
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
				this.eventTarget.dispatchEvent(new ApiResponseEvent(onSubscribe, data));
			});
	}

	sendMessage(message, accountIdentification, deviceIdentification) {
		ow(message, "message", ow.string.nonEmpty);
		ow(accountIdentification, "accountIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.minLength(MinUdidLength));

		return fetchWrapper(`${this.config.apiUrl}/messages`, {
			method: "POST",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
			body: JSON.stringify({message}),
		})
			.then((data) => {
				this.eventTarget.dispatchEvent(new ApiResponseEvent(onSendMessage, data));
			});
	}

	getMessages(accountIdentification, deviceIdentification) {
		ow(accountIdentification, "accountIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.minLength(MinUdidLength));

		return fetchWrapper(`${this.config.apiUrl}/messages`, {
			method: "GET",
			headers: {"x-iris-identification": `${accountIdentification}:${deviceIdentification}`},
		})
			.then((data) => {
				this.eventTarget.dispatchEvent(new ApiResponseEvent(onGetMessages, data));
			});
	}
}

function getFirstErrorNotification(notifications) {
	const errorNotifications = notifications
		.filter(notification => notification.type === ApiResponseNotificationTypeError);
	if(errorNotifications && errorNotifications.length > 0) {
		return errorNotifications[0];
	}

	return ApiGenericError;
}

function fetchWrapper(url, options) {
	return new Promise((resolve, reject) => {
		fetch(url, options)
			.then(response => response.json())
			.then((json) => {
				// Check if we have an API error and throw it
				if(json.status === ApiResponseStatusTypeError) {
					reject(getFirstErrorNotification(json.notifications).message);
				} else {
					resolve(json);
				}
			})
			.catch(() => {
				reject(ApiFetchFailed);
			}); // Reject with generic error message
	});
}
