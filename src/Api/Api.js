// This script contains wrapper functions for making API calls
// You can use this script in a couple ways:
// - `const api = new Api(...)`, this way you can make API calls and handle the returned Promises yourself
// - `const api = new Api(..., ApiEventTarget)`, this will trigger events upon completion of some of the Promises
//    You can use `ApiEventTarget.addEventListener()` to listen for events.

import Config from "./Private/Config";
import ow from "ow";
import {
	ApiFetchFailed, ApiGenericError, CustomHeaderBlacklistError,
	DeviceVersionMaxLength,
	DeviceVersionMinLength, DeviceVersionRegex,
	MinUdidLength,
} from "./Constants/Other";
import ApiResponseEvent from "./Private/ApiResponseEvent";
import {media, messages, messageSent, subscribe} from "./Constants/Events";
import PushTypes from "./Constants/PushTypes";
import DeviceTypes from "./Constants/DeviceTypes";
import {
	error as ErrorResponse,
	warning as WarningResponse,
} from "./Constants/ApiResponseNotificationTypes";
import {error as ErrorStatus} from "./Constants/ApiResponseStatuses";
import {CUSTOMHEADER_BLACKLIST} from "./Constants/CustomHeaderBlacklist";

export default class Api {
	constructor(apiDomain, accountIdentification, deviceIdentification, apiEventTarget, customHeaders) {
		ow(apiEventTarget, "apiEventTarget", ow.object.instanceOf(EventTarget));

		// Rest of the validation is done in the setX() functions
		this.setDomain(apiDomain);
		this.setAccountIdentification(accountIdentification);
		this.setDeviceIdentification(deviceIdentification);
		this.setCustomHeaders(customHeaders);
		this.eventTarget = apiEventTarget;
		this.deviceRegistered = false;
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

	setCustomHeaders(customHeaders) {
		// Ignore empty headers
		if(!customHeaders)
			return;

		ow(customHeaders, "customHeaders", ow.object);

		Object.keys(customHeaders).forEach((customHeader) => {
			const lowerCaseCustomHeader = customHeader.toLowerCase();

			ow(lowerCaseCustomHeader, customHeader, ow.string.nonEmpty);

			// Headers must start with a `x-` prefix
			ow(lowerCaseCustomHeader, customHeader, ow.string.startsWith("x-"));

			// Headers must not start with OUR prefix
			ow(lowerCaseCustomHeader, customHeader, ow.string.not.startsWith("x-parley-"));
			ow(lowerCaseCustomHeader, customHeader, ow.string.not.startsWith("x-iris-"));

			// Headers must not be in blocked list
			ow(lowerCaseCustomHeader, customHeader, ow.string.validate(header => ({
				validator: !CUSTOMHEADER_BLACKLIST.includes(header),
				message: CustomHeaderBlacklistError,
			})));
		});

		this.customHeaders = customHeaders;
	}

	/**
	 * Subscribes this device in the API so it is allowed to send/receive messages
	 * If the device is already subscribed, it returns `false`
	 * Otherwise it will return a `Promise` which will contain the API response
	 *
	 * @param pushToken
	 * @param pushType
	 * @param pushEnabled
	 * @param userAdditionalInformation
	 * @param type
	 * @param version
	 * @param referer
	 * @param authorization
	 * @return {Promise<unknown>|boolean}
	 */
	subscribeDevice(
		pushToken,
		pushType,
		pushEnabled,
		userAdditionalInformation,
		type,
		version,
		referer,
		authorization,
	) {
		// Validate params
		ow(pushToken, "pushToken", ow.optional.string.nonEmpty);
		ow(pushType, "pushType", ow.optional.number.oneOf(Object.values(PushTypes)));
		ow(pushEnabled, "pushEnabled", ow.optional.boolean);
		if(pushEnabled === true) {
			// Somehow `.message()` doesn't work with `nonEmpty`
			ow(pushToken, "pushToken", ow.string.minLength(0).message((value, label) => `${label} is required when using \`pushEnabled\` = \`true\``));
		}
		ow(userAdditionalInformation, "userAdditionalInformation", ow.optional.object.nonEmpty);
		ow(type, "type", ow.optional.number.oneOf(Object.values(DeviceTypes)));
		ow(version, "version", ow.string.minLength(DeviceVersionMinLength));
		ow(version, "version", ow.string.maxLength(DeviceVersionMaxLength));
		ow(version, "version", ow.string.matches(DeviceVersionRegex));
		ow(referer, "referer", ow.optional.string.nonEmpty);
		ow(authorization, "authorization", ow.optional.string.nonEmpty);

		// If the referer isn't set, set it to the window's url
		let refererCopy = referer;
		if(!refererCopy)
			refererCopy = window.location.href;

		return this.fetchWrapper(`${this.config.apiUrl}/devices`, {
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
				referer: refererCopy,
				authorization,
			}),
		})
			.then((data) => {
				this.deviceRegistered = true; // Important, must be before sending out any events

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

	sendMessage(message, referer) {
		ow(message, "message", ow.string.nonEmpty);
		ow(referer, "referer", ow.optional.string.nonEmpty);

		let refererCopy = referer;
		if(!refererCopy)
			refererCopy = window.location.href;


		return this.fetchWrapper(`${this.config.apiUrl}/messages`, {
			method: "POST",
			headers: {"x-iris-identification": `${this.accountIdentification}:${this.deviceIdentification}`},
			body: JSON.stringify({
				message,
				referer: refererCopy,
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
		return this.fetchWrapper(`${this.config.apiUrl}/messages`, {
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

	getMedia(year, month, day, fileName) {
		ow(year, "year", ow.string.nonEmpty);
		ow(month, "month", ow.string.nonEmpty);
		ow(day, "day", ow.string.nonEmpty);
		ow(fileName, "fileName", ow.string.nonEmpty);

		return this.fetchWrapper(`${this.config.apiUrl}/media/${year}/${month}/${day}/${fileName}`, {
			method: "GET",
			headers: {"x-iris-identification": `${this.accountIdentification}:${this.deviceIdentification}`},
		})
			.catch((errorNotifications, warningNotifications) => {
				this.eventTarget.dispatchEvent(new ApiResponseEvent(media, {
					errorNotifications,
					warningNotifications,
					data: null,
				}));
			});
	}

	fetchWrapper(url, options) {
		// Merge any custom headers into the already configured headers
		const extendedOptions = {
			headers: {}, // Headers must always exist
			...options,
		};
		extendedOptions.headers = Object.assign(extendedOptions.headers, this.customHeaders);

		return new Promise((resolve, reject) => {
			fetch(url, extendedOptions)
				.then((response) => {
					const contentType = response.headers.get("Content-Type");

					if(contentType && contentType.includes("application/json"))
						return response.json(); // Handle JSON response
					 else if(contentType && contentType.includes("image"))
						return response.blob(); // Handle image binary response
					 throw new Error("Unsupported response type");
				})
				.then((data) => {
					// Check if we have an API error and throw it
					if(typeof data === "object") {
						if(data.status === ErrorStatus) {
							if(data.notifications) {
								const errorNotifications = data.notifications
									.map(notification => notification.type === ErrorResponse && notification.message);
								const warningNotifications = data.notifications
									.map(notification => notification.type === WarningResponse && notification.message);

								reject(errorNotifications, warningNotifications);
							} else {
								reject([ApiGenericError], []);
							}
						}
					}

					resolve(data);
				})
				.catch(() => {
					reject([ApiFetchFailed], []);
				}); // Reject with generic error message
		});
	}
}
