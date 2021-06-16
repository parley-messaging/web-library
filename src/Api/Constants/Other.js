// This file contains un-categorized constants used by the library

// Error message when the Fetch() request failed (separate from non-200 status codes)
export const ApiFetchFailed = "Network request failed";

// Error message when the Api's `status` is "ERROR",
// but there is not `notification` with type "error"
export const ApiGenericError = "The API request failed but the API did not return an error notification";

// Minimum length of the unique device identifier allowed in the Api
export const MinUdidLength = 10;

// Device `version` param validation constants
export const DeviceVersionMinLength = 5;
export const DeviceVersionMaxLength = 8;
export const DeviceVersionRegex = /[0-9]{1,2}.[0-9]{1,2}.[0-9]{1,2}|[0-9]{6}/u;
