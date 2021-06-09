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

export {
	ApiResponseStatuses,
	ApiResponseNotificationTypes,
	ApiFetchFailed,
	ApiGenericError,
};
