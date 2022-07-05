/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
	require('@cypress/code-coverage/task')(on, config)

	// This is needed to have code coverage over our unit tests
	// We have to use `use-browserify-istanbul` instead of `use-babelrc`
	// because we use the `coverageGlobalScopeFunc: false` setting
	// for istanbul in .babelrc to be compliant for our CSP
	// If we use `use-babelrc` we get an error in Cypress
	// telling us it can't find `coverage on undefined`
	on(
		'file:preprocessor',
		require('@cypress/code-coverage/use-browserify-istanbul')
	)

	// add other tasks to be registered here

	return config
}
