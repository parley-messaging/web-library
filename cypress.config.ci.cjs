const {defineConfig} = require("cypress");

module.exports = defineConfig({
	e2e: {
		// We've imported your old cypress plugins here.
		// You may want to clean this up later by importing these.
		setupNodeEvents(on, config) {
			return require("./cypress/plugins/index.js")(on, config);
		},
		baseUrl: "http://chat-dev.parley.nu:8181",
		specPattern: "cypress/e2e/**/*.{js,jsx,ts,tsx}",
		video: false,
		reporter: "mochawesome",
		reporterOptions: {
			reportFilename: "[name]-report",
			html: false,
			json: true,
		},
		retries: {runMode: 2},
	},
});
