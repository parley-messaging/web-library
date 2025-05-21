const {defineConfig} = require("cypress");
const {cypressConfig} = require("@axe-core/watcher");

const dotenv = require('dotenv');
dotenv.config();

module.exports = defineConfig(
	cypressConfig({
		axe: {
			apiKey: process.env.AXE_API_KEY,
			runContext: {
				include: "#app"
			},
		},
		projectId: "wwda8d",
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
	}),
);
