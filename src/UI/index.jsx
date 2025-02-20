import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import {name} from "../../package.json";
import Logger from "js-logger";
Logger.useDefaults({
	defaultLevel: Logger.ERROR,
	formatter(messages, context) {
		if(context.name)
			messages.unshift(`[${name}:${context.level.name}][${context.name}]`);
		 else
			messages.unshift(`[${name}:${context.level.name}]`);
	},
});

const mountNode = document.getElementById("app");

window.initParleyMessenger = (debug = false) => {
	// eslint-disable-next-line no-undef
	if(process.env.NODE_ENV === "development" || debug === true) {
		Logger.setLevel(Logger.DEBUG); // Make sure you enable "verbose" logging in your console to see DEBUG logs
		ReactDOM.render(<App debug={true} />, mountNode);
	} else {
		ReactDOM.render(<App />, mountNode);
	}
};

window.destroyParleyMessenger = () => {
	ReactDOM.unmountComponentAtNode(mountNode);
};
