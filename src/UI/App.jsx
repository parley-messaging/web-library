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
import {messages, subscribe} from "../Api/Constants/Events";
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

		this.messageIDs = new Set();
		this.visibilityChange = "visibilitychange";
		this.isRegisteringDevice = false;

		const interfaceLanguage = window?.parleySettings?.runOptions?.country || "en";
		const interfaceTextsDefaults = interfaceLanguage === "nl" ? InterfaceTexts.dutch : InterfaceTexts.english;
		this.state = {
			showChat: false,
			offline: false,
			isMobile: isMobile(),
			isiOSMobile: isiOSMobileDevice(),
			interfaceLanguage,
			interfaceTexts: {
				...interfaceTextsDefaults,
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
			deviceIdentification: this.getDeviceIdentification(),
			deviceAuthorization: window?.parleySettings?.authHeader || undefined,
			deviceVersion: version.substr(0, version.indexOf("-")) || version, // Strip any pre-release data, if not present just use the whole version
			userAdditionalInformation: window?.parleySettings?.userAdditionalInformation || undefined,
			workingHours: window?.parleySettings?.weekdays || undefined,
			hideChatOutsideWorkingHours: window?.parleySettings?.interface?.hideChatAfterBusinessHours || undefined,
			apiCustomHeaders: window?.parleySettings?.apiCustomHeaders || undefined,
			cookieDomain: window?.parleySettings?.cookieDomain || undefined,
		};

		this.Api = new Api(
			this.state.apiDomain,
			this.state.accountIdentification,
			this.state.deviceIdentification,
			ApiEventTarget,
			this.state.apiCustomHeaders,
		);
		this.PollingService = new PollingService(this.Api);

		Logger.debug("App started, registering device");

		this.subscribeDeviceWrapper(
			undefined,
			undefined,
			undefined,
			this.state.userAdditionalInformation,
			DeviceTypes.Web,
			this.state.deviceVersion,
			undefined,
			undefined,
		);

		// Make sure layers to proxy exist
		window.parleySettings
			= window.parleySettings ? window.parleySettings : {};
		window.parleySettings.runOptions
			= window.parleySettings.runOptions ? window.parleySettings.runOptions : {};
		window.parleySettings.runOptions.interfaceTexts
			= window.parleySettings.runOptions.interfaceTexts ? window.parleySettings.runOptions.interfaceTexts : {};

		// Store library version into window
		window.parleySettings.version = version;

		// Global functions
		window.hideParleyMessenger = this.hideChat;
		window.showParleyMessenger = this.showChat;
	}

	getDeviceIdentification = () => {
		const cookies = document.cookie.split(";");
		for(let i = 0; i < cookies.length; i++) {
			const [
				name, value,
			] = cookies[i].split("=");
			if(name === "deviceIdentification" && value.length > 0)
				return value;
		}

		return window?.parleySettings?.xIrisIdentification || ApiOptions.deviceIdentification;
	}

	// TODO: Better name
	subscribeDeviceWrapper = (
		pushToken, pushType, pushEnabled,
		userAdditionalInformation, type, deviceVersion,
		referer, authorization,
	) => {
		const body = {
			pushToken,
			pushType,
			pushEnabled,
			userAdditionalInformation,
			type,
			version: deviceVersion,
			referer,
			authorization,
		};

		const storeIntoLocalStorage = JSON.stringify({
			...body,
			accountIdentification: this.Api.accountIdentification,
			deviceIdentification: this.Api.deviceIdentification,
		});

		// Check registration in local storage
		const storedDeviceInformation = localStorage.getItem("deviceInformation");
		if(storedDeviceInformation === storeIntoLocalStorage) {
			Logger.debug("Found same device information from localStorage, using that instead of registering a new device");
			this.Api.deviceRegistered = true;
			return; // No need to call the API if we don't have any new data
		}

		// TODO: Will this cause problems if we call the first one with INVALID data
		//  and the second one with VALID data? Because the second one will be ignored..
		//  Maybe we should queue these, so that if the first one is done
		//  the second one will have to go through the check above to see if
		//  it has NEW data or the SAME data?
		// We don't want to make multiple API calls
		// if one of them is slow for some reason
		if(this.isRegisteringDevice) {
			Logger.debug("Ignoring this device registration call, because another one is still running");
			return;
		}
		this.isRegisteringDevice = true; // Lock this function, so it won't run again while we are registering

		this.Api.subscribeDevice(
			pushToken,
			pushType,
			pushEnabled,
			userAdditionalInformation,
			type,
			deviceVersion,
			referer,
			authorization,
		)
			.then(() => {
				// Save registration in local storage
				localStorage.setItem("deviceInformation", storeIntoLocalStorage);

				Logger.debug("Device registered, ", {
					accountIdentification: this.Api.accountIdentification,
					deviceIdentification: this.Api.deviceIdentification,
				});
			})
			.finally(() => {
				this.isRegisteringDevice = false; // Unlock this function, so it can be called again
			});
	}

	// eslint-disable-next-line no-unused-vars
	shouldComponentUpdate(nextProps, nextState, nextContext) {
		// Toggle interface language if it has changed
		if(nextState.interfaceLanguage !== this.state.interfaceLanguage) {
			Logger.debug("Interface language changed, changing interface texts");
			this.toggleLanguage(nextState.interfaceLanguage);
		}

		// Create a new Api instance and register a new device when accountIdentification has changed
		if(nextState.accountIdentification !== this.state.accountIdentification
			|| nextState.deviceIdentification !== this.state.deviceIdentification
			|| nextState.cookieDomain !== this.state.cookieDomain
		) {
			if(nextState.accountIdentification !== this.state.accountIdentification)
				Logger.debug("Account identification changed, registering new device");
			if(nextState.deviceIdentification !== this.state.deviceIdentification)
				Logger.debug("Device identification changed, registering new device");
			if(nextState.cookieDomain !== this.state.cookieDomain)
				Logger.debug("Cookie domain changed, registering new device");

			// Remove old cookie containing the (old) device identification
			document.cookie = `deviceIdentification=; expires=${new Date().toUTCString()}; path=/; Domain=${this.state.cookieDomain}`;

			// Remove old device info, otherwise we cannot create a new one with the same info
			localStorage.removeItem("deviceInformation");

			// Make sure we stop otherwise it will poll for the old device info
			this.PollingService.stopPolling();

			this.Api = new Api(
				nextState.apiDomain,
				nextState.accountIdentification,
				nextState.deviceIdentification,
				ApiEventTarget,
			);
			this.PollingService = new PollingService(this.Api);
			this.subscribeDeviceWrapper(
				undefined,
				undefined,
				undefined,
				nextState.userAdditionalInformation,
				DeviceTypes.Web,
				this.state.deviceVersion,
				undefined,
				nextState.deviceAuthorization,
			);
			this.PollingService.restartPolling();
		}

		// Re-register device when deviceAuthorization changes
		// and when userAdditionalInformation changes
		if(nextState.deviceAuthorization !== this.state.deviceAuthorization
			|| nextState.userAdditionalInformation !== this.state.userAdditionalInformation
		) {
			if(nextState.deviceAuthorization !== this.state.deviceAuthorization)
				Logger.debug("Device authorization changed, registering new device");
			if(nextState.userAdditionalInformation !== this.state.userAdditionalInformation)
				Logger.debug("User additional information changed, registering new device");

			this.subscribeDeviceWrapper(
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
		if(nextState.workingHours !== this.state.workingHours) {
			Logger.debug("Working hours changed, changing online/offline mode");
			this.checkWorkingHours();
		}

		if(nextState.apiCustomHeaders !== this.state.apiCustomHeaders) {
			Logger.debug("Api custom headers changed, setting new custom headers");
			this.Api.setCustomHeaders(nextState.apiCustomHeaders);
		}

		return true;
	}

	componentDidMount() {
		this.checkWorkingHours();

		ApiEventTarget.addEventListener(messages, this.handleNewMessage);
		ApiEventTarget.addEventListener(subscribe, this.handleSubscribe);
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
		ApiEventTarget.removeEventListener(subscribe, this.handleSubscribe);
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
				// We ignore "userAdditionalInformation" and "customApiHeaders", because we don't
				// care about renaming their keys (the keys are dynamic).
				if(typeof change.value === "object"
					&& change.value !== null
					&& !Array.isArray(change.value)
					&& change.path[0] !== "userAdditionalInformation"
					&& change.path[0] !== "apiCustomHeaders"
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
		} else if(path[layer0] === "xIrisIdentification") {
			objectToSaveIntoState = {deviceIdentification: value};
		} else if(path[layer0] === "userAdditionalInformation") {
			const userAdditionalInformation
				= JSON.parse(JSON.stringify(window.parleySettings.userAdditionalInformation));
			objectToSaveIntoState = {userAdditionalInformation};

			// We're using JSON.parse(JSON.stringify()) to remove the Proxy
			// from the object
		} else if(path[layer0] === "apiCustomHeaders") {
			const apiCustomHeaders = JSON.parse(JSON.stringify(window.parleySettings.apiCustomHeaders));
			objectToSaveIntoState = {apiCustomHeaders};

			// We're using JSON.parse(JSON.stringify()) to remove the Proxy
			// from the object
		} else if(path[layer0] === "cookieDomain") {
			objectToSaveIntoState = {cookieDomain: value};
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
		Logger.debug("Show chat, re-registering device");

		this.setState(() => ({showChat: true}));

		// Try to re-register the device if it is not yet registered
		this.subscribeDeviceWrapper(
			undefined,
			undefined,
			undefined,
			this.state.userAdditionalInformation,
			DeviceTypes.Web,
			this.state.deviceVersion,
			undefined,
			undefined,
		);
	}

	hideChat = () => {
		Logger.debug("Hide chat");

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

	handleNewMessage = (event) => {
		// Keep track of all the message IDs so we can show the
		// chat when we received a new message
		let foundNewMessages = false;
		event.detail.data.forEach((message) => {
			if(!this.messageIDs.has(message.id)) {
				this.messageIDs.add(message.id);
				foundNewMessages = true;
			}
		});

		// Show the chat when we received a new message
		if(!this.state.showChat && foundNewMessages)
			this.showChat();
	}

	handleSubscribe = (event) => {
		// We don't want to do this the api returned errors
		if(event.detail.errorNotifications)
			return;

		// Create a new cookie (or override existing) containing the (new) device identification
		document.cookie = `deviceIdentification=${this.state.deviceIdentification}; path=/; Domain=${this.state.cookieDomain}`;
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
