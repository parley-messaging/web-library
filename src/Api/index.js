import ApiEventTarget from "./ApiEventTarget";

let apiObject = null;
export function apiSingleton(apiDomain) {
	if(!apiObject)
		apiObject = new ApiEventTarget(apiDomain);

	return apiObject;
}
