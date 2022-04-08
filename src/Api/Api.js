// This script contains wrapper functions for making API calls
// You can use this script in a couple ways:
// - `const api = new Api(...)`, this way you can make API calls and handle the returned Promises yourself
// - `const api = new Api(..., ApiEventTarget)`, this will trigger events upon completion of some of the Promises
//    You can use `ApiEventTarget.addEventListener()` to listen for events.

import Config from "./Private/Config";
import ow from "ow";
import {
	ApiFetchFailed, ApiGenericError,
	DeviceVersionMaxLength,
	DeviceVersionMinLength, DeviceVersionRegex,
	MinUdidLength,
} from "./Constants/Other";
import ApiResponseEvent from "./Private/ApiResponseEvent";
import {messages, messageSent, subscribe} from "./Constants/Events";
import PushTypes from "./Constants/PushTypes";
import DeviceTypes from "./Constants/DeviceTypes";
import {
	error as ErrorResponse,
	warning as WarningResponse,
} from "./Constants/ApiResponseNotificationTypes";
import {error as ErrorStatus} from "./Constants/ApiResponseStatuses";


export default class Api {
	constructor(apiDomain, accountIdentification, deviceIdentification, apiEventTarget) {
		ow(apiEventTarget, "apiEventTarget", ow.object.instanceOf(EventTarget));

		// Rest of the validation is done in the setX() functions

		this.setDomain(apiDomain);
		this.setAccountIdentification(accountIdentification);
		this.setDeviceIdentification(deviceIdentification);
		this.eventTarget = apiEventTarget;
	}

	setDomain(apiDomain) {
		ow(apiDomain, "apiDomain", ow.string.nonEmpty);

		this.config = new Config(apiDomain);
	}

	setAccountIdentification(accountIdentification) {
		ow(accountIdentification, "accountIdentification", ow.string.nonEmpty);

		this.accountIdentification = accountIdentification;
	}

	setDeviceIdentification(deviceIdentification) {
		ow(deviceIdentification, "deviceIdentification", ow.string.nonEmpty);
		ow(deviceIdentification, "deviceIdentification", ow.string.minLength(MinUdidLength));

		this.deviceIdentification = deviceIdentification;
	}

	subscribeDevice(
		pushToken,
		pushType,
		pushEnabled,
		userAdditionalInformation,
		type,
		version,
		referrer,
		authorization,
	) {
		// Validate params
		ow(pushToken, "pushToken", ow.optional.string.nonEmpty);
		ow(pushType, "pushType", ow.optional.number.oneOf(Object.values(PushTypes)));
		ow(pushEnabled, "pushEnabled", ow.optional.boolean);
		if(pushEnabled === true) {
			// Somehow `message()` doesn't work with `nonEmpty`
			ow(pushToken, "pushToken", ow.string.minLength(0).message((value, label) => `${label} is required when using \`pushEnabled\` = \`true\``));
		}
		ow(userAdditionalInformation, "userAdditionalInformation", ow.optional.object.nonEmpty);
		ow(type, "type", ow.optional.number.oneOf(Object.values(DeviceTypes)));
		ow(version, "version", ow.string.minLength(DeviceVersionMinLength));
		ow(version, "version", ow.string.maxLength(DeviceVersionMaxLength));
		ow(version, "version", ow.string.matches(DeviceVersionRegex));
		ow(referrer, "referrer", ow.optional.string.nonEmpty);
		ow(authorization, "authorization", ow.optional.string.nonEmpty);

		let referrerCopy = referrer;
		if(!referrerCopy)
			referrerCopy = window.location.href;

		return fetchWrapper(`${this.config.apiUrl}/devices`, {
			method: "POST",
			headers: {
				"x-iris-identification": `${this.accountIdentification}:${this.deviceIdentification}`,
				Authorization: authorization || "",
			},
			body: JSON.stringify({
				pushToken,
				pushType,
				pushEnabled,
				userAdditionalInformation,
				type,
				version,
				referer: referrerCopy,
			}),
		})
			.then((data) => {
				this.eventTarget.dispatchEvent(new ApiResponseEvent(subscribe, data));
				return data;
			})
			.catch((errorNotifications, warningNotifications) => {
				this.eventTarget.dispatchEvent(new ApiResponseEvent(subscribe, {
					errorNotifications,
					warningNotifications,
					data: null,
				}));
			});
	}

	sendMessage(message, referrer) {
		ow(message, "message", ow.string.nonEmpty);
		ow(referrer, "referrer", ow.optional.string.nonEmpty);

		let referrerCopy = referrer;
		if(!referrerCopy)
			referrerCopy = window.location.href;


		return fetchWrapper(`${this.config.apiUrl}/messages`, {
			method: "POST",
			headers: {"x-iris-identification": `${this.accountIdentification}:${this.deviceIdentification}`},
			body: JSON.stringify({
				message,
				referer: referrerCopy,
			}),
		})
			.then((data) => {
				this.eventTarget.dispatchEvent(new ApiResponseEvent(messageSent, data));
				return data;
			})
			.catch((errorNotifications, warningNotifications) => {
				this.eventTarget.dispatchEvent(new ApiResponseEvent(messageSent, {
					errorNotifications,
					warningNotifications,
					data: null,
				}));
			});
	}

	getMessages() {
		return fetchWrapper(`${this.config.apiUrl}/messages`, {
			method: "GET",
			headers: {"x-iris-identification": `${this.accountIdentification}:${this.deviceIdentification}`},
		})
			.then((data) => {
				this.eventTarget.dispatchEvent(new ApiResponseEvent(messages, data));
				return data;
			})
			.catch((errorNotifications, warningNotifications) => {
				this.eventTarget.dispatchEvent(new ApiResponseEvent(messages, {
					errorNotifications,
					warningNotifications,
					data: null,
				}));
			});
	}
}

function fetchWrapper(url, options) {
	return new Promise((resolve, reject) => {
		fetch(url, options)
			.then(response => response.json())
			.then((json) => {
				// Check if we have an API error and throw it
				if(json.status === ErrorStatus) {
					if(json.notifications) {
						const errorNotifications = json.notifications
							.map(notification => notification.type === ErrorResponse && notification.message);
						const warningNotifications = json.notifications
							.map(notification => notification.type === WarningResponse && notification.message);

						reject(errorNotifications, warningNotifications);
					} else {
						reject([ApiGenericError], []);
					}
				} else {
					resolve(json);
				}
			})
			.catch(() => {
				reject([ApiFetchFailed], []);
			}); // Reject with generic error message
	});
}
