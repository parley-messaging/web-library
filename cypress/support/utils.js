/**
 * Intercepts a request and only sends it to the server
 * if you resolve the promise by calling `sendResponse()`
 * This way you can do UI assertions while the request is busy
 *
 * @param {string} method
 * @param {string} routeMatcher
 * @param response
 */
export function interceptIndefinitely(method, routeMatcher, response = undefined) {
	let sendResponse;
	const trigger = new Promise((resolve) => {
		sendResponse = resolve;
	});

	cy.intercept(method, routeMatcher, (req) => {
		return trigger.then(() => {
			if(response)
				req.reply(response);
			 else
				req.continue();
		});
	});

	return {sendResponse};
}
