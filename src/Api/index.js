// This script contains the entrypoint for the Api scripts.
// It can create a singleton of the ApiEventTarget class for you
// so you dont have to recreate it each time you need it.

import ApiEventTarget from "./ApiEventTarget";

let apiObject = null;
export function apiEventTargetSingleton(apiDomain) {
	if(!apiObject)
		apiObject = new ApiEventTarget(apiDomain);

	return apiObject;
}
