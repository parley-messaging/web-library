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

export const defaultParleyConfig = {roomNumber: "0cce5bfcdbf07978b269"};
export const messagesUrlRegex = /.*\/messages(?:\/(?:after|before):\d+)?(?!\/)/u; // This matches /messages and /messages/after:123
export function visitHome(parleyConfig, onBeforeLoad, onLoad) {
	cy.visit("/", {
		onBeforeLoad: (window) => {
			// eslint-disable-next-line no-param-reassign
			window.parleySettings = {
				...defaultParleyConfig, // Always set default config
				...parleyConfig,
			};
			if(onBeforeLoad)
				onBeforeLoad(window);
		},
		onLoad: (window) => {
			if(onLoad)
				onLoad(window);


			window.initParleyMessenger();
		},
	});
	cy.get("[id=app]")
		.as("app");
}

export function clickOnLauncher() {
	return cy.get("@app")
		.find("[class^=parley-messaging-launcher__]")
		.find("button")
		.should("be.visible")
		.click();
}

export function sendMessage(testMessage) {
	return cy.get("@app")
		.find("[class^=parley-messaging-chat__]")
		.should("be.visible")
		.find("[class^=parley-messaging-footer__]")
		.should("be.visible")
		.find("[class^=parley-messaging-text__]")
		.should("be.visible")
		.find("textarea")
		.should("have.focus")
		.type(`${testMessage}{enter}`);
}

export function findMessage(testMessage) {
	return cy.get("@app")
		.find("[class^=parley-messaging-wrapper__]")
		.should("be.visible")
		.find("[class^=parley-messaging-body__]")
		.should("be.visible")
		.contains(testMessage)
		.should("be.visible");
}

export function pretendToBeMobile(window) {
	// Mock match media to return true
	Object.defineProperty(window, "matchMedia", {value: arg => ({matches: Boolean(arg.includes("(pointer: coarse)"))})});
}

export function _beforeEach() {
	console.log("");
	console.log(`=== BEGIN ${Cypress.currentTest.title} ===`);
	console.log("");

	// This should not go in afterEach,
	// see https://docs.cypress.io/guides/references/best-practices#Using-after-or-afterEach-hooks
	cy.window()
		.then((window) => {
			if(window.destroyParleyMessenger)
				window.destroyParleyMessenger();
		})
		.then(() => {
			return cy.clearLocalStorage();
		});
}

export function _afterEach() {
	console.log("");
	console.log(`=== END ${Cypress.currentTest.title} ===`);
	console.log("");
}
