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
			setupNodeEvents(on, config) {
				return require("./cypress/plugins/index.js")(on, config);
			},
			baseUrl: "https://chat-dev.parley.nu:8181",
			specPattern: "cypress/e2e/**/*.{js,jsx,ts,tsx}",
			watchForFileChanges: false,
			experimentalRunAllSpecs: true,
		},
		defaultBrowser: "chrome"
	}),
);
