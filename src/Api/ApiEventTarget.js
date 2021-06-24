// This script will dispatch events from Api.js
// It provides subscribable events which get fired upon response of the API.
// This way you can listen for responses on multiple locations.

class ApiEventTarget extends EventTarget {
	//
}

export default new ApiEventTarget();
