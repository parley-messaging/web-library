// This file contains all the functions that we don't want to
// export in the Api.js class.
// You can call these "private" functions as they are not becoming
// public when you import the Api.js class

import {ApiResponseStatuses, ApiResponseNotificationTypes, ApiFetchFailed, ApiGenericError} from "./Constants";

function getFirstErrorNotification(notifications) {
	const errorNotifications = notifications
		.filter(notification => notification.type === ApiResponseNotificationTypes.error);
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
				if(json.status === ApiResponseStatuses.error) {
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

export default {fetchWrapper};
