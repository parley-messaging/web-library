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
import {MessengerOpenState} from "./Scripts/MessengerOpenState";

export default class App extends React.Component {
	constructor(props) {
		super(props);

		this.messageIDs = new Set();
		this.visibilityChange = "visibilitychange";
		const interfaceLanguage = window?.parleySettings?.runOptions?.country || "en";
		const interfaceTextsDefaults = interfaceLanguage === "nl" ? InterfaceTexts.dutch : InterfaceTexts.english;
		const showChat = false;
		this.state = {
			showChat,
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
			persistDeviceBetweenDomain: window?.parleySettings?.persistDeviceBetweenDomain || undefined,
			storagePrefix: window?.parleySettings?.storagePrefix || undefined,
			messengerOpenState: showChat ? MessengerOpenState.open : MessengerOpenState.minimize,
			launcherIcon: window?.parleySettings?.runOptions?.icon || undefined,
		};

		this.Api = new Api(
			this.state.apiDomain,
			this.state.accountIdentification,
			this.state.deviceIdentification,
			ApiEventTarget,
			this.state.apiCustomHeaders,
		);
		this.PollingService = new PollingService(this.Api);

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

		Logger.debug("App initialized");
	}

	/**
	 * Creates a new cookie with:
	 * - name: `deviceIdentification`
	 * - value: the value you provide in `deviceIdentification`
	 * - domain: the value you provide in `cookieDomain`
	 * @param deviceIdentification {string}
	 * @param cookieDomain {string}
	 */
	createDeviceIdentificationCookie = (deviceIdentification, cookieDomain) => {
		// If we don't have a persistDeviceBetweenDomain (maybe because the setting is not enabled)
		// we don't want to create the cookie
		if(!cookieDomain)
			return;

		// Create a new cookie (or override existing) containing the (new) device identification
		document.cookie = `deviceIdentification=${deviceIdentification}; path=/; Domain=${cookieDomain}`;
	}

	/**
	 * Removes the deviceIdentification cookie, that matches the `cookieDomain`, from the storage
	 * @param cookieDomain {string}
	 */
	removeDeviceIdentificationCookie = (cookieDomain) => {
		// Remove old cookie containing the (old) device identification
		document.cookie = `deviceIdentification=; expires=${new Date().toUTCString()}; path=/; Domain=${cookieDomain}`;
	}

	/**
	 * Tries to find the device identification cookie and returns its value or `undefined`
	 * if the cookie is not found
	 * @return {string|undefined}
	 */
	getDeviceIdentificationCookie = () => {
		const cookies = document.cookie.split(";");
		for(let i = 0; i < cookies.length; i++) {
			const [
				name, value,
			] = cookies[i].split("=");

			// Make sure to trim any whitespace from the name
			// Some user agents use ";" and some use "; "
			if(name.trim() === "deviceIdentification" && value.length > 0)
				return value;
		}

		return undefined;
	}

	/**
	 * Because we keep the device identification in multiple places we need to decide which ones
	 * have priority over the other locations. This function returns the device identification
	 * from the place with the highest priority first and goes down in the list if needed
	 * @return {string|*|string}
	 */
	getDeviceIdentification = () => {
		// First; If parleySettings has an identification, always use that
		const parleySettingsIdentification = window?.parleySettings?.xIrisIdentification;
		if(parleySettingsIdentification)
			return parleySettingsIdentification;

		// Second; Get identification from cookie
		const cookieDeviceIdentification = this.getDeviceIdentificationCookie();
		if(cookieDeviceIdentification)
			return cookieDeviceIdentification;

		// Third; Get identification from localStorage
		const localStorageIdentification = JSON.parse(localStorage.getItem("deviceInformation"))?.deviceIdentification;
		if(localStorageIdentification)
			return localStorageIdentification;

		// Last; Create a new identification
		return ApiOptions.deviceIdentification;
	}

	/**
	 * A wrapper for Api.subscribeDevice which will only register a device if
	 * the current device is not yet registered.
	 * @param pushToken
	 * @param pushType
	 * @param pushEnabled
	 * @param userAdditionalInformation
	 * @param type
	 * @param deviceVersion
	 * @param referer
	 * @param authorization
	 * @param force bool If true, it will not check for any existing registrations and force a new one
	 */
	subscribeDevice = (
		pushToken, pushType, pushEnabled,
		userAdditionalInformation, type, deviceVersion,
		referer, authorization, force,
	) => {
		if(!force) {
			if(this.Api.deviceRegistered) {
				Logger.debug("Device is already registered, not registering a new one");
				return; // Don't register if we already are registered
			}
			if(this.Api.isDeviceRegistrationPending) {
				Logger.debug("There is already a device registration pending, not registering a new one");
				return;
			}
		}

		if(authorization !== this.Api.authorization) {
			Logger.debug("Using new Authorization from now on", {
				oldAuthorization: this.Api.authorization,
				newAuthorization: authorization,
			});
			this.Api.setAuthorization(authorization);
		}

		Logger.debug("Registering new device");

		// Store the device identification, so we don't generate a new one on each registration
		const storeIntoLocalStorage = JSON.stringify({deviceIdentification: this.Api.deviceIdentification});

		this.Api.subscribeDevice(
			pushToken,
			pushType,
			pushEnabled,
			userAdditionalInformation,
			type,
			deviceVersion,
			referer,
		)
			.then(() => {
				// Save registration in local storage
				localStorage.setItem("deviceInformation", storeIntoLocalStorage);

				// Also save registration in the device identification cookie
				// (if the persistDeviceBetweenDomain setting is used)
				if(this.state.persistDeviceBetweenDomain) {
					this.createDeviceIdentificationCookie(
						this.state.deviceIdentification,
						this.state.persistDeviceBetweenDomain,
					);
				}

				Logger.debug("Device registered, ", {
					accountIdentification: this.Api.accountIdentification,
					deviceIdentification: this.Api.deviceIdentification,
					authorization: this.Api.authorization,
				});
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
			|| nextState.persistDeviceBetweenDomain !== this.state.persistDeviceBetweenDomain
		) {
			if(nextState.accountIdentification !== this.state.accountIdentification)
				Logger.debug("Account identification changed, registering new device");
			if(nextState.deviceIdentification !== this.state.deviceIdentification)
				Logger.debug("Device identification changed, registering new device");
			if(nextState.persistDeviceBetweenDomain !== this.state.persistDeviceBetweenDomain)
				Logger.debug("Cookie domain changed, registering new device");

			this.removeDeviceIdentificationCookie(this.state.persistDeviceBetweenDomain);

			// Make sure we stop otherwise it will poll for the old device info
			this.PollingService.stopPolling();

			this.Api = new Api(
				nextState.apiDomain,
				nextState.accountIdentification,
				nextState.deviceIdentification,
				ApiEventTarget,
			);
			this.PollingService = new PollingService(this.Api);
			this.subscribeDevice(
				undefined,
				undefined,
				undefined,
				nextState.userAdditionalInformation,
				DeviceTypes.Web,
				this.state.deviceVersion,
				undefined,
				nextState.deviceAuthorization,
				true,
			);
			this.PollingService.restartPolling();
		}

		// Re-register device when deviceAuthorization changes
		// and when userAdditionalInformation changes
		const nextStateUserAdditionalInformation = JSON.stringify(nextState.userAdditionalInformation);
		const stateUserAdditionalInformation = JSON.stringify(this.state.userAdditionalInformation);
		if(nextState.deviceAuthorization !== this.state.deviceAuthorization
			|| nextStateUserAdditionalInformation !== stateUserAdditionalInformation
		) {
			if(nextState.deviceAuthorization !== this.state.deviceAuthorization)
				Logger.debug("Device authorization changed, registering new device");

			if(nextStateUserAdditionalInformation !== stateUserAdditionalInformation)
				Logger.debug("User additional information changed, registering new device");

			this.subscribeDevice(
				undefined,
				undefined,
				undefined,
				nextState.userAdditionalInformation || undefined,
				DeviceTypes.Web,
				this.state.deviceVersion,
				undefined,
				nextState.deviceAuthorization || undefined,
				true,
			);
		}

		// Check working hours when they changed
		if(nextState.workingHours !== this.state.workingHours) {
			Logger.debug("Working hours changed, changing online/offline mode");
			this.checkWorkingHours();
		}

		if(JSON.stringify(nextState.apiCustomHeaders) !== JSON.stringify(this.state.apiCustomHeaders)) {
			Logger.debug("Api custom headers changed, setting new custom headers");
			this.Api.setCustomHeaders(nextState.apiCustomHeaders);
		}

		if(nextState.messengerOpenState !== this.state.messengerOpenState) {
			Logger.debug(`messengerOpenState state changed from '${this.state.messengerOpenState}' to '${nextState.messengerOpenState}'`);
			this.saveMessengerOpenState(nextState.messengerOpenState);
		}

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

		// Check if our messengerOpenState is in sync with the localStorage
		const messengerOpenState = localStorage.getItem("messengerOpenState");
		Logger.debug(`messengerOpenState value in localStorage is '${messengerOpenState}'`);
		if(messengerOpenState === MessengerOpenState.open)
			this.showChat();
		 else if(messengerOpenState === MessengerOpenState.minimize)
			this.hideChat();
		 else
			this.saveMessengerOpenState(this.state.messengerOpenState); // Save the current state into the localStorage
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
				// We don't want arrays because we don't want to loop
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
			} else if(path[layer1] === "icon") {
				objectToSaveIntoState = {launcherIcon: value};
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
		} else if(path[layer0] === "persistDeviceBetweenDomain") {
			objectToSaveIntoState = {persistDeviceBetweenDomain: value};
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
		Logger.debug("Show chat, registering device");

		this.setState(() => ({
			showChat: true,
			messengerOpenState: MessengerOpenState.open,
		}));

		// Try to re-register the device if it is not yet registered
		this.subscribeDevice(
			undefined,
			undefined,
			undefined,
			this.state.userAdditionalInformation,
			DeviceTypes.Web,
			this.state.deviceVersion,
			undefined,
			this.state.deviceAuthorization,
			false,
		);
	}

	hideChat = () => {
		Logger.debug("Hide chat");

		this.setState(() => ({
			showChat: false,
			messengerOpenState: MessengerOpenState.minimize,
		}));
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
		eventData.detail.data?.forEach((message) => {
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
		Logger.debug(`Offline mode ${this.state.offline ? "enabled" : "disabled"}`);
	}

	saveMessengerOpenState = (messengerOpenState) => {
		Logger.debug(`Saving messengerOpenState value '${messengerOpenState}' into localStorage`);
		localStorage.setItem("messengerOpenState", messengerOpenState);
	}

	render() {
		return (
			<InterfaceTextsContext.Provider value={this.state.interfaceTexts}>
				{
					!(this.state.offline && this.state.hideChatOutsideWorkingHours)
						&& <Launcher
							icon={this.state.launcherIcon}
							messengerOpenState={this.state.messengerOpenState}
							onClick={this.handleClick}
						   />
				}
				<Chat
					allowEmoji={true}
					allowFileUpload={true}
					api={this.Api}
					closeButton={this.state.closeButton}
					isMobile={this.state.isMobile}
					isiOSMobile={this.state.isiOSMobile}
					onMinimizeClick={this.handleClick}
					restartPolling={this.restartPolling}
					showChat={this.state.showChat}
					title={this.state.interfaceTexts.title}
					welcomeMessage={this.state.interfaceTexts.welcomeMessage}
				/>
			</InterfaceTextsContext.Provider>
		);
	}
}

App.propTypes = {
	debug: PropTypes.bool,
	name: PropTypes.string,
};
