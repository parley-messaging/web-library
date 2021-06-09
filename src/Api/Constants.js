// This file contains all the constants
// used by the Api

// All the different `status` values for api responses
const ApiResponseStatuses = {
	success: "SUCCESS",
	error: "ERROR",
};

// All the different `notifications[x].type` values for api responses
const ApiResponseNotificationTypes = {
	success: "success",
	error: "error",
	warning: "warning",
};

// Error message when the Fetch() request failed (separate from non-200 status codes)
const ApiFetchFailed = "Network request failed"; // TODO: Be more descriptive as to why it failed?

// Error message when the Api's `status` is "ERROR", but there is not `notification` with type "error"
const ApiGenericError = "The API request failed but the API did not return an error notification";

// Minimum length of the unique device identifier allowed in the Api
const MinUdidLength = 10;

// Different push types a Device can have
const PushTypes = {
	FCMAndroid: 1,
	APNS: 2,
	FCMWeb: 3,
	CustomWebhook: 4,
	CustomWebhookOAuth: 5,
	FCMUniversal: 6,
};
const PushTypesAsArray = Object.values(PushTypes);

// Different types a Device can have
const DeviceTypes = {
	Android: 1,
	iOS: 2,
	Web: 3,
	Generic: 4,
};
const DeviceTypesAsArray = Object.values(DeviceTypes);

// Device `version` param validation constants
const DeviceVersionMinLength = 5;
const DeviceVersionMaxLength = 8;
const DeviceVersionRegex = /[0-9]{1,2}.[0-9]{1,2}.[0-9]{1,2}|[0-9]{6}/u;

// Api events on which you can create event listeners
const Events = {
	onSubscribe: "onSubscribe",
	onSendMessage: "onSendMessage",
	onGetMessages: "onGetMessages",
};

export {
	ApiResponseStatuses,
	ApiResponseNotificationTypes,
	ApiFetchFailed,
	ApiGenericError,
	MinUdidLength,
	PushTypes,
	PushTypesAsArray,
	DeviceTypes,
	DeviceTypesAsArray,
	DeviceVersionMinLength,
	DeviceVersionMaxLength,
	DeviceVersionRegex,
	Events,
};
