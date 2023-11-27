const {defineConfig} = require("cypress");

module.exports = defineConfig({
	projectId: "wwda8d",
	e2e: {
		// We've imported your old cypress plugins here.
		// You may want to clean this up later by importing these.
		setupNodeEvents(on, config) {
			return require("./cypress/plugins/index.js")(on, config);
		},
		baseUrl: "https://chat-dev.parley.nu:8181",
		specPattern: "cypress/e2e/**/*.{js,jsx,ts,tsx}",
	},
});
