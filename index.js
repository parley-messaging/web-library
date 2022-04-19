// Wait until the library is loaded (init function is available)
// and initialize it
const intervalID = setInterval(() => {
	const initFunction = window.initParleyMessenger;
	if(!initFunction)
		return;

	initFunction();
	clearInterval(intervalID);
// eslint-disable-next-line no-magic-numbers
}, 200);
