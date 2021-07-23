import {config} from "@fortawesome/fontawesome-svg-core";

// Make sure this is before any other `fontawesome` API calls
// This will disable the automatic css insertion
// More info: https://fontawesome.com/v5.15/how-to-use/on-the-web/other-topics/security
config.autoAddCss = false;

// Next we need to manually import the fontawesome CSS
import "@fortawesome/fontawesome-svg-core/styles.css";

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
import {Observable} from "object-observer";
import deepForEach from "deep-for-each";
import Logger from "js-logger";
import {areWeOnline} from "./Scripts/WorkingHours";
import {isiOSMobileDevice, isMobile} from "./Scripts/OSRecognition";

export default class App extends React.Component {
	constructor(props) {
		super(props);

		const interfaceLanguage = window?.parleySettings?.runOptions?.country || "en";
		const interfaceTextsDefaults = interfaceLanguage === "nl" ? InterfaceTexts.dutch : InterfaceTexts.english;
		this.state = {
			showChat: false,
			offline: false,
			isMobile: isMobile(),
			isiOSMobile: isiOSMobileDevice(),
			interfaceLanguage,
			interfaceTexts: {
				title: window?.parleySettings?.runOptions?.interfaceTexts
					?.desc || interfaceTextsDefaults.title,
				inputPlaceholder: window?.parleySettings?.runOptions?.interfaceTexts
					?.placeholderMessenger || interfaceTextsDefaults.inputPlaceholder,
				sendingMessageFailedError: window?.parleySettings?.runOptions?.interfaceTexts
					?.messageSendFailed || interfaceTextsDefaults.sendingMessageFailedError,
				serviceUnreachableError: window?.parleySettings?.runOptions?.interfaceTexts
					?.serviceUnreachableNotification || interfaceTextsDefaults.serviceUnreachableError,
				welcomeMessage: window?.parleySettings?.runOptions?.interfaceTexts
					?.infoText || interfaceTextsDefaults.welcomeMessage,
			},
			apiDomain: window?.parleySettings?.apiDomain || ApiOptions.apiDomain,
			accountIdentification: window?.parleySettings?.roomNumber || ApiOptions.accountIdentification,
			deviceIdentification: window?.parleySettings?.xIrisIdentification || ApiOptions.deviceIdentification, // TODO: Test reactivity (do we even need it?)
			deviceAuthorization: window?.parleySettings?.authHeader || undefined,
			deviceVersion: version.substr(0, version.indexOf("-")), // Strip any pre-release data
			userAdditionalInformation: window?.parleySettings?.userAdditionalInformation || undefined,
			workingHours: window?.parleySettings?.weekdays || undefined,
			hideChatOutsideWorkingHours: window?.parleySettings?.interface?.hideChatAfterBusinessHours || undefined,
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
			this.state.userAdditionalInformation,
			DeviceTypes.Web,
			this.state.deviceVersion,
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
				nextState.userAdditionalInformation,
				DeviceTypes.Web,
				this.state.deviceVersion,
				undefined,
				nextState.deviceAuthorization,
			);
		}

		// Re-register device when deviceAuthorization changes
		// and when userAdditionalInformation changes
		if(nextState.deviceAuthorization !== this.state.deviceAuthorization
			|| nextState.userAdditionalInformation !== this.state.userAdditionalInformation
		) {
			this.Api.subscribeDevice(
				undefined,
				undefined,
				undefined,
				nextState.userAdditionalInformation || undefined,
				DeviceTypes.Web,
				this.state.deviceVersion,
				undefined,
				nextState.deviceAuthorization || undefined,
			);
		}

		// Check working hours when they changed
		if(nextState.workingHours !== this.state.workingHours)
			this.checkWorkingHours();

		return true;
	}

	componentDidMount() {
		this.checkWorkingHours();

		ApiEventTarget.addEventListener(messages, this.handleNewMessage);
		window.addEventListener("focus", this.handleFocusWindow);

		if(typeof document.hidden !== "undefined")
			document.addEventListener(this.visibilityChange, this.handleVisibilityChange);

		// Create proxy for parley settings to track any changes
		// We do this after the mount because `createParleyProxy` contains
		// `setState()` calls, which should not be called before mounting
		window.parleySettings = this.createParleyProxy(window.parleySettings);
	}

	componentWillUnmount() {
		ApiEventTarget.removeEventListener(messages, this.handleNewMessage);
		window.removeEventListener("focus", this.handleFocusWindow);

		if(typeof document.hidden !== "undefined")
			document.removeEventListener(this.visibilityChange, this.handleVisibilityChange);

		// Stop polling and remove any event listeners created by the Polling Service
		this.PollingService.stopPolling();

		// Remove Proxy from parleySettings which will remove set() trap from proxy
		// so it doesn't call `setState()` anymore
		window.parleySettings = JSON.parse(JSON.stringify(window.parleySettings));
	}

	/**
	 * This will create a Proxy for everything inside `target`
	 * It wil trap the `set` function
	 * When the `set` is called, it will direct this update to
	 * `setParleySettingIntoState` which will rename old settings
	 * to new, and save it into the state (if possible)
	 *
	 * @param target
	 * @return Observable
	 */
	createParleyProxy = (target) => {
		const proxy = Observable.from(target);
		proxy.observe((changes) => {
			changes.forEach((change) => {
				// If the new value is an object, we need to go through
				// ALL properties and rename/apply them to the state.
				// We don't want arrays because we dont want to loop
				// over them.
				// We ignore "userAdditionalInformation", because we don't
				// care about renaming it's keys.
				if(typeof change.value === "object"
					&& change.value !== null
					&& !Array.isArray(change.value)
					&& change.path[0] !== "userAdditionalInformation"
				) {
					deepForEach(change.value, (value, key) => {
						// Extend the path with the key
						// Make sure we "clone" instead of direct referencing change.path
						const fullPath = [
							...change.path,
							key,
						];

						this.setParleySettingIntoState(fullPath, value);
					});

				// If it is anything else than an object, we can
				// directly rename/apply it to the state
				} else {
					this.setParleySettingIntoState(change.path, change.value);
				}
			});
		});

		return proxy;
	}

	/**
	 * This will update the interfaceTexts values in the state
	 * to the ones of the correct language.
	 * It will preserve any overrides made using `window.parleySettings`
	 *
	 * @param newLanguage
	 */
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
		// TODO: This also tries to save things like "buttonMenu", which is in the context
		//  but not in the state.. This produces warnings for each setting that is not in state
		deepForEach(newInterfaceTexts, (value, key) => {
			this.setParleySettingIntoState([
				"runOptions", "interfaceTexts", key,
			], value);
		});
	}

	/**
	 * This will update the state with the new value
	 * and a renamed key (if needed)
	 * It looks trough the `path` to see if we need
	 * to rename a key to it's new variant.
	 *
	 * @param path
	 * @param value
	 */
	setParleySettingIntoState = (path, value) => {
		const layer0 = 0;
		const layer1 = 1;
		const layer2 = 2;

		let objectToSaveIntoState;

		if(path[layer0] === "runOptions") {
			if(path[layer1] === "interfaceTexts") {
				// Check if interfaceTexts has the property from layer2
				// If it does, we add the whole layer to `interfaceTexts`
				// Important: This only goes until layer2, it will not validate properties beyond that
				if(Object.prototype.hasOwnProperty.call(this.state.interfaceTexts, path[layer2])) {
					objectToSaveIntoState = {interfaceTexts: {}};
					objectToSaveIntoState.interfaceTexts[path[layer2]] = value;
				} else if(path[layer2] === "desc") {
					objectToSaveIntoState = {interfaceTexts: {title: value}};
				} else if(path[layer2] === "infoText") {
					objectToSaveIntoState = {interfaceTexts: {welcomeMessage: value}};
				} else if(path[layer2] === "placeholderMessenger") {
					objectToSaveIntoState = {interfaceTexts: {inputPlaceholder: value}};
				}
			} else if(path[layer1] === "country") {
				objectToSaveIntoState = {interfaceLanguage: value};
			}
		} else if(path[layer0] === "interface") {
			if(path[layer1] === "hideChatAfterBusinessHours")
				objectToSaveIntoState = {hideChatOutsideWorkingHours: value};
		} else if(path[layer0] === "roomNumber") {
			objectToSaveIntoState = {accountIdentification: value};
		} else if(path[layer0] === "authHeader") {
			objectToSaveIntoState = {deviceAuthorization: value};
		} else if(path[layer0] === "weekdays") {
			objectToSaveIntoState = {workingHours: value};
		} else if(path[layer0] === "userAdditionalInformation") {
			objectToSaveIntoState = {userAdditionalInformation: {}};
			objectToSaveIntoState.userAdditionalInformation
				= JSON.parse(JSON.stringify(window.parleySettings.userAdditionalInformation));

			// For `userAdditionalInformation` we don't care about validating
			// the contents. So we can just directly add it to the state.
			// We're using JSON.parse(JSON.stringify()) to remove the Proxy
			// from the object
		}

		if(objectToSaveIntoState) {
			this.setState(prevState => deepMerge(prevState, objectToSaveIntoState));
			Logger.debug("Saved into state:", objectToSaveIntoState);
		} else {
			Logger.debug("Found unknown setting:", path.join("."));
		}
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

	checkWorkingHours = () => {
		this.setState(prevState => ({offline: !areWeOnline(prevState.workingHours)}));
	}

	render() {
		return (
			<InterfaceTextsContext.Provider value={this.state.interfaceTexts}>
				{
					!(this.state.offline && this.state.hideChatOutsideWorkingHours)
						&& <Launcher onClick={this.handleClick} />
				}
				{
					this.state.showChat
						&& <Chat
							allowEmoji={true}
							allowFileUpload={true}
							api={this.Api}
							closeButton={this.state.closeButton}
							isMobile={this.state.isMobile}
							isiOSMobile={this.state.isiOSMobile}
							onMinimizeClick={this.handleClick}
							restartPolling={this.restartPolling}
							title={this.state.interfaceTexts.title}
							welcomeMessage={this.state.interfaceTexts.welcomeMessage}
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
