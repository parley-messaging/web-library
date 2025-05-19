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

export function generateParleyMessages(amount, dateMs = Date.now(), chanceForAgentMessage = 0.4) {
	const messages = [];
	const timeBetweenMessages = 30; // seconds
	const beginTime = (dateMs / 1000) - (amount * timeBetweenMessages);

	for(let i = 0; i < amount; i++) {
		const newMessage = {
			id: i + 1,
			time: beginTime + (i * timeBetweenMessages),
			message: `Message number ${i}`,
			image: null,
			typeId: 1,
			carousel: [],
			quickReplies: [],
			custom: [],
			title: null,
			media: null,
			buttons: [],
		};

		if(Math.random() <= chanceForAgentMessage) {
			newMessage.typeId = 2;
			newMessage.agent = {
				id: 2,
				name: "Tracebuzz",
				avatar: "https://beta.tracebuzz.com/images/avatars/1912991618/6033.jpg",
				isTyping: null,
			};
		}

		messages[i] = newMessage;
	}

	return messages;
}
