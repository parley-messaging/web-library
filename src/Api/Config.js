// This script contains a simple object for storing API configurations.
// It is used whenever an API call is made so it knows where to send the request.

export default class Config {
	constructor(apiDomain = "https://api.parley.nu") {
		this.apiDomain = apiDomain;
		this.apiUrl = `${apiDomain}/clientApi/v1.3`;
	}
}
