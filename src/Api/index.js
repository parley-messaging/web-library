// This script contains the entrypoint for the Api scripts.
// It can create a singleton of the Api class for you
// so you dont have to recreate it each time you need it.

import ApiEventTarget from "./ApiEventTarget";
import Api from "./Api";

let apiObject = null;
export function apiSingleton(apiDomain) {
	if(!apiObject) {
		apiObject = new Api(apiDomain, ApiEventTarget);
	}

	return apiObject;
}
