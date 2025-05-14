// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

import "@cypress/code-coverage/support";

import "cypress-axe";
Cypress.on("window:before:load", (win) => {
	// this lets React DevTools "see" components inside application's iframe
	// eslint-disable-next-line no-param-reassign
	win.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.top.__REACT_DEVTOOLS_GLOBAL_HOOK__;

	// Create an array to store the captured debug messages
	const capturedDebugMessages = [];

	// Capture console.debug messages
	const originalConsoleDebug = win.console.debug;
	// eslint-disable-next-line no-param-reassign
	win.console.debug = (...args) => {
		const message = args.join(" ");

		// Add the debug message to the capturedDebugMessages array
		capturedDebugMessages.push(message);

		// Call the original console.debug method
		originalConsoleDebug.apply(win.console, args);
	};

	// Expose the capturedDebugMessages array globally
	// eslint-disable-next-line no-param-reassign
	win.__capturedDebugMessages = capturedDebugMessages;
});
