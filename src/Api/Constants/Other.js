import {SUPPORTED_MEDIA_TYPES} from "./SupportedMediaTypes";

// This file contains un-categorized constants used by the library

// Error message when the Fetch() request failed (separate from non-200 status codes)
export const ApiFetchFailed = "Network request failed";

// Error message when the Api's `status` is "ERROR",
// but there is not `notification` with type "error"
export const ApiGenericError = "Something went wrong, please try again later";

// Minimum length of the unique device identifier allowed in the Api
export const MinUdidLength = 10;

// Device `version` param validation constants
export const DeviceVersionMinLength = 5;
export const DeviceVersionMaxLength = 8;
export const DeviceVersionRegex = /^[0-9]{1,2}.[0-9]{1,2}.[0-9]{1,2}|[0-9]{6}/u;

export const CustomHeaderBlacklistError = "This is a blacklisted header, please use a different header name";

export function isSupportedMediaType(contentType) {
	return SUPPORTED_MEDIA_TYPES.some(type => contentType.includes(type));
}
