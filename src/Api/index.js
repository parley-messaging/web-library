import Api from "./Api";

let apiObject = null;
export function apiSingleton(apiDomain) {
	if(!apiObject)
		apiObject = new Api(apiDomain);

	return apiObject;
}
