// This script contains the custom events that are fired
// in the Api.js script.
// These event objects are passed along to the event listeners.

export default class ApiResponseEvent extends CustomEvent {
	constructor(eventName, data) {
		super(eventName, {detail: data});
	}
}
