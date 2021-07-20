import React from "react";
import PropTypes from "prop-types";
import Launcher from "./Launcher";
import Chat from "./Chat";
import Api from "../Api/Api";
import ApiEventTarget from "../Api/ApiEventTarget";
import {version} from "../../package.json";
import PollingService from "../Api/Polling";
import {messages} from "../Api/Constants/Events";
import DeviceTypes from "../Api/Constants/DeviceTypes";
import {ApiOptions, InterfaceTexts, InterfaceTextsContext} from "./Scripts/Context";
import deepMerge from "deepmerge";
import Logger from "js-logger";

export default class App extends React.Component {
	constructor(props) {
		super(props);

		const interfaceLanguage = window?.parleySettings?.country || "en";
		this.state = {
			showChat: false,
			interfaceLanguage,
			interfaceTexts: {
				...interfaceLanguage === "nl" ? InterfaceTexts.dutch : InterfaceTexts.english,
				...window?.parleySettings?.runOptions?.interfaceTexts,
			},
			apiDomain: window?.parleySettings?.apiDomain || ApiOptions.apiDomain,
			accountIdentification: window?.parleySettings?.roomNumber || ApiOptions.accountIdentification,
			deviceIdentification: window?.parleySettings?.xIrisIdentification || ApiOptions.deviceIdentification,
			deviceAuthorization: window?.parleySettings?.authHeader || "",
		};

		this.Api = new Api(
			this.state.apiDomain,
			this.state.accountIdentification,
			this.state.deviceIdentification,
			ApiEventTarget,
		);
		this.PollingService = new PollingService(this.Api);
		this.Api.subscribeDevice(
			undefined,
			undefined,
			undefined,
			undefined,
			DeviceTypes.Web,
			version,
		);
		this.messageIDs = new Set();
		this.visibilityChange = "visibilitychange";

		// Make sure layers to proxy exist
		window.parleySettings
			= window.parleySettings ? window.parleySettings : {};
		window.parleySettings.runOptions
			= window.parleySettings.runOptions ? window.parleySettings.runOptions : {};
		window.parleySettings.runOptions.interfaceTexts
			= window.parleySettings.runOptions.interfaceTexts ? window.parleySettings.runOptions.interfaceTexts : {};

		// Create proxy for each layer we need to track
		window.parleySettings
			= this.createParleyProxy(window.parleySettings);
		window.parleySettings.runOptions
			= this.createParleyProxy(window.parleySettings.runOptions);
		window.parleySettings.runOptions.interfaceTexts
			= this.createParleyProxy(window.parleySettings.runOptions.interfaceTexts, "interfaceTexts");
	}

	createParleyProxy = (target, parent) => new Proxy(target, {
		set: (obj, property, value) => {
			// eslint-disable-next-line no-param-reassign
			obj[property] = value; // no-op, always allow setting something

			Logger.info(`Setter fired for property: ${property} with value: ${JSON.stringify(value)}`);

			// If we don't stringify `value`, it will log a reference which can contain
			// a changed value and not the real value at this time

			if(parent) {
				// If we have a parent we need to put our value
				// inside that parent and save the parent (with the value)
				// into the state, instead of saving the value only
				const newValue = {};
				newValue[property] = value;

				this.setParleySettingIntoState(newValue, parent); // Try to save the value into the State
			} else {
				this.setParleySettingIntoState(value, property); // Try to save the value into the State
			}

			return true; // Indicate success
		},
	})

	toggleLanguage = (newLanguage) => {
		let newInterfaceTexts = deepMerge(
			InterfaceTexts.english,
			window.parleySettings.runOptions.interfaceTexts,
		);
		if(newLanguage === "nl") {
			newInterfaceTexts = deepMerge(
				InterfaceTexts.dutch,
				window.parleySettings.runOptions.interfaceTexts,
			);
		}

		// We use setParleySettingIntoState() here instead of setState()
		// because we don't want any invalid properties
		// from the window.parleySetting ending up in the state
		this.setParleySettingIntoState(newInterfaceTexts, "interfaceTexts");
	}

	/**
	 * Puts a Parley setting and it's value into the state
	 * It wil convert legacy setting names to the new ones
	 * if applicable
	 *
	 * @param value
	 * @param property
	 * @return boolean
	 */
	setParleySettingIntoState = (value, property) => {
		const newKey = this.convertLegacySettings(property);

		const newObject = {};
		newObject[newKey] = value;

		if(Object.prototype.hasOwnProperty.call(this.state, newKey)) {
			// TODO: Should we validate contents of objects?
			//  otherwise you can still fill up the state with nonsense, just camouflaged as an object

			this.setState(prevState => deepMerge(prevState, newObject));

			Logger.info(`Merged the following into the state: ${JSON.stringify(newObject)}`);

			return true;
		}

		Logger.warn("Property is not initialized in the state; ", newObject, " so this was not added to the state");
		return false;
	}

	/**
	 * Converts legacy parley setting names to the new ones
	 * If the `legacyKey` is not recognized, it is returned untouched
	 *
	 * @param legacyKey
	 * @return {string|*}
	 */
	convertLegacySettings = (legacyKey) => {
		if(legacyKey === "country")
			return "interfaceLanguage";
		else if(legacyKey === "roomNumber")
			return "accountIdentification";
		else if(legacyKey === "authHeader")
			return "deviceAuthorization";

		return legacyKey;
	}

	// eslint-disable-next-line no-unused-vars
	shouldComponentUpdate(nextProps, nextState, nextContext) {
		// Toggle interface language if it has changed
		if(nextState.interfaceLanguage !== this.state.interfaceLanguage)
			this.toggleLanguage(nextState.interfaceLanguage);

		// Create a new Api instance and register a new device when accountIdentification has changed
		if(nextState.accountIdentification !== this.state.accountIdentification) {
			this.Api = new Api(
				nextState.apiDomain,
				nextState.accountIdentification,
				nextState.deviceIdentification,
				ApiEventTarget,
			);
			this.PollingService = new PollingService(this.Api);
			this.Api.subscribeDevice(
				undefined,
				undefined,
				undefined,
				undefined,
				DeviceTypes.Web,
				version,
			);
		}

		// Re-register device when deviceAuthorization changes
		if(nextState.deviceAuthorization !== this.state.deviceAuthorization) {
			this.Api.subscribeDevice(
				undefined,
				undefined,
				undefined,
				undefined,
				DeviceTypes.Web,
				version,
				undefined,
				nextState.deviceAuthorization,
			);
		}

		return true;
	}

	componentDidMount() {
		ApiEventTarget.addEventListener(messages, this.handleNewMessage);
		window.addEventListener("focus", this.handleFocusWindow);

		if(typeof document.hidden !== "undefined")
			document.addEventListener(this.visibilityChange, this.handleVisibilityChange);

		this.setState(() => ({showChat: false}));
	}

	componentWillUnmount() {
		ApiEventTarget.removeEventListener(messages, this.handleNewMessage);
		window.removeEventListener("focus", this.handleFocusWindow);

		if(typeof document.hidden !== "undefined")
			document.removeEventListener(this.visibilityChange, this.handleVisibilityChange);

		// Stop polling and remove any event listeners created by the Polling Service
		this.PollingService.stopPolling();
	}

	handleFocusWindow = () => {
		// Restart polling when window receives focus
		this.PollingService.restartPolling();
	}

	handleVisibilityChange = () => {
		// Restart polling when page is becoming visible
		if(!document.hidden)
			this.PollingService.restartPolling();
	}

	handleClick = () => {
		this.toggleChat();
	}

	showChat = () => {
		this.setState(() => ({showChat: true}));
	}

	hideChat = () => {
		this.setState(() => ({showChat: false}));
	}

	toggleChat = () => {
		if(this.state.showChat)
			this.hideChat();
		 else
			this.showChat();
	}

	restartPolling = () => {
		this.PollingService.restartPolling();
	}

	handleNewMessage = (eventData) => {
		// Keep track of all the message IDs so we can show the
		// chat when we received a new message
		let foundNewMessages = false;
		eventData.detail.data.forEach((message) => {
			if(!this.messageIDs.has(message.id)) {
				this.messageIDs.add(message.id);
				foundNewMessages = true;
			}
		});

		// Show the chat when we received a new message
		if(!this.state.showChat && foundNewMessages)
			this.showChat();
	}

	render() {
		return (
			<InterfaceTextsContext.Provider value={this.state.interfaceTexts}>
				<Launcher onClick={this.handleClick} />
				{
					this.state.showChat
						&& <Chat
							allowEmoji={true}
							allowFileUpload={true}
							api={this.Api}
							closeButton={this.state.closeButton}
							onMinimizeClick={this.handleClick}
							restartPolling={this.restartPolling}
							title={this.state.interfaceTexts.desc}
							welcomeMessage={this.state.interfaceTexts.infoText}
						   />
				}
			</InterfaceTextsContext.Provider>
		);
	}
}

App.propTypes = {
	debug: PropTypes.bool,
	name: PropTypes.string,
};
