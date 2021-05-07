export default class ApiResponseEvent extends CustomEvent {
	constructor(eventName, data) {
		super(eventName, {detail: data});
	}
}
