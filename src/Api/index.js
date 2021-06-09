// This script contains the entrypoint for the Api scripts.
// It can create a singleton of the Api class for you
// so you dont have to recreate it each time you need it.

import ApiEventTarget from "./ApiEventTarget";
import Api from "./Api";

let apiObject = null;
let apiEventTarget = null;
export function apiSingleton(apiDomain) {
	if(!apiEventTarget) {
		apiEventTarget = new ApiEventTarget();
	}

	if(!apiObject) {
		apiObject = new Api(apiDomain, apiEventTarget);
	}

	return apiObject;
}
