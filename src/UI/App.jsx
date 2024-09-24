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
import {MessengerOpenState} from "./Scripts/MessengerOpenState";
import Cookies from "js-cookie";
import MessageTypes from "../Api/Constants/MessageTypes";

export default class App extends React.Component {
	constructor(props) {
		Logger.debug("Initializing app");

		super(props);

		this.messageIDs = new Set();
		this.visibilityChange = "visibilitychange";
		this.cookieAgeRefreshIntervalId = null;
		this._isMounted = false;
		this.mainPollingServiceName = "main-polling-service";
		this.slowPollingServiceName = "slow-polling-service";
		this.unreadMessagesActions = {
			openChatWindow: 0,
			showMessageCounterBadge: 1,
		};

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
				// Load the default values
				...interfaceTextsDefaults,

				// Load all the overrides which have deprecated names
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

				// Load all other overrides
				...this.loadInterfaceTextOverrides(Object.keys(interfaceTextsDefaults)),
			},
			apiDomain: window?.parleySettings?.apiDomain || ApiOptions.apiDomain,
			accountIdentification: window?.parleySettings?.roomNumber || ApiOptions.accountIdentification,
			deviceIdentification: this.getDeviceIdentification(),
			deviceAuthorization: window?.parleySettings?.authHeader || undefined,
			deviceVersion: version.substr(0, version.indexOf("-")) || version, // Strip any pre-release data, if not present just use the whole version
			userAdditionalInformation: window?.parleySettings?.userAdditionalInformation || undefined,
			workingHours: window?.parleySettings?.weekdays || undefined,
			hideChatOutsideWorkingHours: typeof window?.parleySettings?.interface?.hideChatAfterBusinessHours === "boolean"
				? window?.parleySettings?.interface?.hideChatAfterBusinessHours
				: false,
			apiCustomHeaders: window?.parleySettings?.apiCustomHeaders || undefined,
			devicePersistence: {
				domain: window?.parleySettings?.devicePersistence?.domain || undefined,
				ageUpdateInterval: window?.parleySettings?.devicePersistence?.ageUpdateInterval || undefined,
				ageUpdateIncrement: window?.parleySettings?.devicePersistence?.ageUpdateIncrement || undefined,
			},
			storagePrefix: window?.parleySettings?.storagePrefix || undefined,
			messengerOpenState: showChat ? MessengerOpenState.open : MessengerOpenState.minimize,
			launcherIcon: window?.parleySettings?.runOptions?.icon || undefined,
			allowMediaUpload: typeof window?.parleySettings?.runOptions?.allowFileUpload === "boolean"
				? window?.parleySettings?.runOptions?.allowFileUpload
				: true,
			allowedMediaTypes: window?.parleySettings?.runOptions?.allowedMediaTypes || undefined,
			amountOfNewAgentMessagesFound: 0,
			unreadMessagesAction: window?.parleySettings?.interface?.unreadMessagesAction
				|| this.unreadMessagesActions.openChatWindow,
		};

		this.Api = new Api(
			this.state.apiDomain,
			this.state.accountIdentification,
			this.state.deviceIdentification,
			ApiEventTarget,
			this.state.apiCustomHeaders,
		);
		this.PollingService = new PollingService(this.mainPollingServiceName, this.Api);
		this.SlowPollingService = new PollingService(this.slowPollingServiceName, this.Api, [
			"5m", "15m", "30m", "2h", "5h", "6h",
		]);

		// Make sure layers to proxy exist
		window.parleySettings
			= window.parleySettings ? window.parleySettings : {};
		window.parleySettings.runOptions
			= window.parleySettings.runOptions ? window.parleySettings.runOptions : {};
		window.parleySettings.runOptions.interfaceTexts
			= window.parleySettings.runOptions.interfaceTexts ? window.parleySettings.runOptions.interfaceTexts : {};
		window.parleySettings.devicePersistence
			= window.parleySettings.devicePersistence ? window.parleySettings.devicePersistence : {};

		// Store library version into window
		window.parleySettings.version = version;

		// Global functions
		window.hideParleyMessenger = this.hideChat;
		window.showParleyMessenger = this.showChat;

		Logger.debug("App initialized");
	}

	/**
	 * Returns the `window.parleySettings.runOptions.interfaceTexts`, but only with the
	 * texts that are overridable. The texts that are overridable are given by
	 * the `overridableTextsKeys` param.
	 *
	 * The problem this function solves is when you load in all
	 * `window.parleySettings.runOptions.interfaceTexts` you will also load in their deprecated
	 * names (if used). These deprecated names are not used anymore internally in the state,
	 * so we have separate import rules for these texts.
	 *
	 * An example is `window.parleySettings.runOptions.interfaceTexts.desc`, this is internally
	 * used as `state.interfaceTexts.title`, so we can't just import it without renaming it.
	 * `desc` will be seen as non-overridable and thus won't be returned by this function.
	 * @param {[]} overridableTextsKeys
	 * @return {[]} An object containing the interfaceTexts (and their values) which can be used
	 * to override the default texts.
	 */
	loadInterfaceTextOverrides = (overridableTextsKeys) => {
		const overridesFromWindow = {...window?.parleySettings?.runOptions?.interfaceTexts};

		// Remove all keys that are not overridable
		Object.keys(overridesFromWindow)
			.forEach((key) => {
				if(!overridableTextsKeys.includes(key))
					delete overridesFromWindow[key];
			});

		return overridesFromWindow;
	};

	/**
	 * Creates a new cookie with that stores the device identification
	 * @param {string} deviceIdentification
	 * @param {string} domain
	 * @param {number} ageUpdateIncrement
	 */
	createDeviceIdentificationCookie = (deviceIdentification, domain, ageUpdateIncrement = undefined) => {
		// If we don't have a devicePersistence.domain (maybe because the setting is not enabled)
		// we don't want to create the cookie
		if(!domain) {
			Logger.debug("Not creating device identification cookie, because setting devicePersistence.domain is not set");
			return;
		}

		const cookieAttributes = {
			path: "/",
			domain,
		};

		if(ageUpdateIncrement) {
			const expiryDate = new Date();
			expiryDate.setSeconds(expiryDate.getSeconds() + ageUpdateIncrement);
			cookieAttributes.expires = expiryDate;
		}

		const createdCookie = Cookies.set("deviceIdentification", deviceIdentification, cookieAttributes);

		Logger.debug(`Cookie created:`, createdCookie);
	};

	/**
	 * Removes the deviceIdentification cookie, that matches the `cookieDomain`, from the storage
	 */
	removeDeviceIdentificationCookie = () => {
		Cookies.remove("deviceIdentification", {
			path: "/",
			domain: this.state.devicePersistence.domain,
		});

		Logger.debug(`Deleted cookie deviceIdentification cookie`);
	};

	/**
	 * Tries to find the device identification cookie and returns its value or `undefined`
	 * if the cookie is not found
	 * @return {string|undefined}
	 */
	getDeviceIdentificationCookie = () => Cookies.get("deviceIdentification");

	/**
	 * Because we keep the device identification in multiple places we need to decide which ones
	 * have priority over the other locations. This function returns the device identification
	 * from the place with the highest priority first and goes down in the list if needed
	 * @param forceNew bool If true, it will create a new device identification
	 * @return {string|*|string}
	 */
	getDeviceIdentification = (forceNew = false) => {
		if(forceNew) {
			Logger.debug("Forcing new device identification, so creating a new one.");
			const newDeviceIdentification = ApiOptions.generateDeviceIdentification();
			this._isMounted && this.setState(() => ({deviceIdentification: newDeviceIdentification}));
			return newDeviceIdentification;
		}

		// First; Get it from the state
		const stateIdentification = this.state?.deviceIdentification;
		if(stateIdentification) {
			Logger.debug("Found device identification in the state, so using that.");
			return stateIdentification;
		}

		// Second; If parleySettings has an identification, use that
		const parleySettingsIdentification = window?.parleySettings?.xIrisIdentification;
		if(parleySettingsIdentification) {
			Logger.debug("Found device identification in window.parleySettings.xIrisIdentification, so using that.");
			this._isMounted && this.setState(() => ({deviceIdentification: parleySettingsIdentification}));
			return parleySettingsIdentification;
		}

		// Third; Get identification from cookie
		// NOTE: It is not possible to check the expiry time from the cookie, so if it is expired
		// and the browser has not yet removed the cookie we can't do anything about that.
		const cookieDeviceIdentification = this.getDeviceIdentificationCookie();
		if(cookieDeviceIdentification) {
			Logger.debug("Found device identification in the device identification cookie, so using that.");
			this._isMounted && this.setState(() => ({deviceIdentification: cookieDeviceIdentification}));
			return cookieDeviceIdentification;
		}

		// Fourth; Get identification from localStorage
		const localStorageIdentification = JSON.parse(localStorage.getItem("deviceInformation"))?.deviceIdentification;
		if(localStorageIdentification) {
			Logger.debug("Found device identification in the localStorage, so using that.");
			this._isMounted && this.setState(() => ({deviceIdentification: localStorageIdentification}));
			return localStorageIdentification;
		}

		// Last; Create a new identification
		const newDeviceIdentification = ApiOptions.generateDeviceIdentification();
		Logger.debug("No existing device identifications found, so creating a new one.");
		this._isMounted && this.setState(() => ({deviceIdentification: newDeviceIdentification}));
		return newDeviceIdentification;
	};

	/**
	 * A wrapper for Api.subscribeDevice which will only register a device if
	 * the current device is not yet registered.
	 * @param userAdditionalInformation
	 * @param authorization
	 * @param forceNewRegistration bool If true, it will not check for any existing registrations and force a new one
	 */
	subscribeDevice = (
		userAdditionalInformation = this.state.userAdditionalInformation,
		authorization = this.state.deviceAuthorization,
		forceNewRegistration = false,
	) => {
		const pushToken = undefined; // Not supported yet
		const pushType = undefined; // Not supported yet
		const pushEnabled = undefined; // Not supported yet
		const referer = undefined; // Not supported yet
		const type = DeviceTypes.Web;
		const {deviceVersion} = this.state;

		Logger.debug("Registering new device");

		if(!forceNewRegistration) {
			if(this.Api.deviceRegistered) {
				Logger.debug("Device is already registered, not registering a new one");
				return Promise.resolve(); // Don't register if we already are registered
			}
			if(this.Api.isDeviceRegistrationPending) {
				Logger.debug("There is already a device registration pending, not registering a new one");
				return Promise.resolve();
			}
		}

		if(authorization !== this.Api.authorization) {
			Logger.debug("Using new Authorization from now on", {
				oldAuthorization: this.Api.authorization,
				newAuthorization: authorization,
			});
			this.Api.setAuthorization(authorization);
		}

		// Store the device identification, so we don't generate a new one on each registration
		const storeIntoLocalStorage = JSON.stringify({deviceIdentification: this.Api.deviceIdentification});

		return this.Api.subscribeDevice(
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

				Logger.debug("Device registered, ", {
					accountIdentification: this.Api.accountIdentification,
					deviceIdentification: this.Api.deviceIdentification,
					authorization: this.Api.authorization,
				});
			});
	};

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
			|| nextState.devicePersistence.domain !== this.state.devicePersistence.domain
		) {
			if(nextState.accountIdentification !== this.state.accountIdentification)
				Logger.debug("Account identification changed, registering new device");


			if(nextState.deviceIdentification !== this.state.deviceIdentification)
				Logger.debug("Device identification changed, registering new device");


			if(nextState.devicePersistence.domain !== this.state.devicePersistence.domain)
				Logger.debug("Cookie domain changed, registering new device");


			this.removeDeviceIdentificationCookie(this.state.devicePersistence.domain);

			// Make sure we stop otherwise it will poll for the old device info
			this.PollingService.stopPolling();

			this.Api = new Api(
				nextState.apiDomain,
				nextState.accountIdentification,
				nextState.deviceIdentification,
				ApiEventTarget,
			);
			this.PollingService = new PollingService(this.mainPollingServiceName, this.Api);
			this.subscribeDevice(
				nextState.userAdditionalInformation,
				nextState.deviceAuthorization,
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
				nextState.userAdditionalInformation || undefined,
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

		// Restart cookie age update interval upon changes to relevant settings
		if(nextState.devicePersistence.ageUpdateInterval !== this.state.devicePersistence.ageUpdateInterval
			|| nextState.devicePersistence.ageUpdateIncrement !== this.state.devicePersistence.ageUpdateIncrement
			|| nextState.devicePersistence.domain !== this.state.devicePersistence.domain
			|| nextState.deviceIdentification !== this.state.deviceIdentification
		) {
			if(nextState.devicePersistence.ageUpdateInterval !== this.state.devicePersistence.ageUpdateInterval)
				Logger.debug("Device persistence age update interval changed, recreating interval");


			if(nextState.devicePersistence.ageUpdateIncrement !== this.state.devicePersistence.ageUpdateIncrement)
				Logger.debug("Device persistence age update increment changed, recreating interval");


			if(nextState.devicePersistence.domain !== this.state.devicePersistence.domain)
				Logger.debug("Device persistence domain changed, recreating interval");


			if(nextState.deviceIdentification !== this.state.deviceIdentification)
				Logger.debug("Device identification changed, recreating interval");


			this.startCookieAgeUpdateInterval(
				nextState.deviceIdentification,
				nextState.devicePersistence.domain,
				nextState.devicePersistence.ageUpdateInterval,
				nextState.devicePersistence.ageUpdateIncrement,
			);
		}

		return true;
	}

	componentDidMount() {
		this._isMounted = true;
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

		// Check if our messengerOpenState is in sync with the localStorage
		const messengerOpenState = localStorage.getItem("messengerOpenState");
		Logger.debug(`messengerOpenState value in localStorage is '${messengerOpenState}'`);
		if(messengerOpenState === MessengerOpenState.open)
			this.showChat();
		 else if(messengerOpenState === MessengerOpenState.minimize)
			this.hideChat();
		 else
			this.saveMessengerOpenState(this.state.messengerOpenState);

		// Start slow polling if there was a chat started sometime before
		const lastReceivedAgentMessageId = localStorage.getItem("lastReceivedAgentMessageId");
		if(lastReceivedAgentMessageId !== null) {
			Logger.debug("Starting slow polling service because 'lastReceivedAgentMessageId' is set in local storage");
			if(this.PollingService.isRunning) {
				Logger.debug("Polling service is running, stopping it because we only want slow polling at this moment");
				this.PollingService.stopPolling();
			}
			if(this.Api.deviceRegistered) {
				this.SlowPollingService.startPolling();
			} else {
				Logger.debug("Device was not registered, so registering device first");
				this.subscribeDevice()
					.then(() => {
						this.SlowPollingService.startPolling();
					});
			}
		}
	}

	componentWillUnmount() {
		this._isMounted = false;

		ApiEventTarget.removeEventListener(messages, this.handleNewMessage);
		ApiEventTarget.removeEventListener(subscribe, this.handleSubscribe);
		window.removeEventListener("focus", this.handleFocusWindow);

		this.stopCookieAgeUpdateInterval();

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
	};

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
	};

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
				} else if(path[layer2] === "messageSendFailed") {
					objectToSaveIntoState = {interfaceTexts: {sendingMessageFailedError: value}};
				} else if(path[layer2] === "serviceUnreachableNotification") {
					objectToSaveIntoState = {interfaceTexts: {serviceUnreachableError: value}};
				}
			} else if(path[layer1] === "country") {
				objectToSaveIntoState = {interfaceLanguage: value};
			} else if(path[layer1] === "icon") {
				objectToSaveIntoState = {launcherIcon: value};
			} else if(path[layer1] === "allowedMediaTypes") {
				// Clear the current allowedMediaTypes, otherwise the deepmerge
				// further down will merge your new list with the current one.
				// This is not what we want, we only want to have the new values
				// and discard all the old values.
				// Also, we don't use setState() so we don't trigger an update.
				if(this.state.allowedMediaTypes)
					this.state.allowedMediaTypes.splice(0, this.state.allowedMediaTypes.length);

				objectToSaveIntoState = {allowedMediaTypes: value};
			} else if(path[layer1] === "allowFileUpload") {
				objectToSaveIntoState = {allowMediaUpload: value};
			}
		} else if(path[layer0] === "interface") {
			if(path[layer1] === "hideChatAfterBusinessHours")
				objectToSaveIntoState = {hideChatOutsideWorkingHours: value};
			else if(path[layer1] === "unreadMessagesAction")
				objectToSaveIntoState = {unreadMessagesAction: value};
		} else if(path[layer0] === "roomNumber") {
			objectToSaveIntoState = {accountIdentification: value};
		} else if(path[layer0] === "authHeader") {
			objectToSaveIntoState = {deviceAuthorization: value};
		} else if(path[layer0] === "weekdays") {
			// Find existing weekdays that have the same day name as the new value
			// If we find any we delete them so the new setting can override them.
			value.forEach((newWeekday) => {
				const existingWeekday = this.state.workingHours?.find((stateWeekday) => {
					if(stateWeekday[0].toLowerCase !== undefined) {
						// Dealing with ["Day", start, end]
						return stateWeekday[0].toLowerCase() === newWeekday[0].toLowerCase();
					}

					// Dealing with [startTimestamp, endTimestamp]
					return stateWeekday[0] === newWeekday[0];
				});
				if(existingWeekday)
					this.state.workingHours.splice(this.state.workingHours.indexOf(existingWeekday), 1);
			});

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
		} else if(path[layer0] === "devicePersistence") {
			if(path[layer1] === "domain")
				objectToSaveIntoState = {devicePersistence: {domain: value}};
			 else if(path[layer1] === "ageUpdateInterval")
				objectToSaveIntoState = {devicePersistence: {ageUpdateInterval: value}};
			 else if(path[layer1] === "ageUpdateIncrement")
				objectToSaveIntoState = {devicePersistence: {ageUpdateIncrement: value}};
		}

		if(objectToSaveIntoState) {
			this.setState(prevState => deepMerge(prevState, objectToSaveIntoState));
			Logger.debug("Saved into state:", objectToSaveIntoState);
		} else {
			Logger.debug("Found unknown setting:", path.join("."));
		}
	};

	handleFocusWindow = () => {
		// Restart polling when window receives focus
		this.PollingService.restartPolling();
	};

	handleVisibilityChange = () => {
		// Restart polling when page is becoming visible
		if(!document.hidden)
			this.PollingService.restartPolling();
	};

	handleClick = () => {
		this.toggleChat();
	};

	showChat = () => {
		if(this.SlowPollingService.isRunning) {
			Logger.debug("Show chat, stopping active slow polling service");
			this.SlowPollingService.stopPolling();
		}

		Logger.debug("Show chat, registering device");

		this.setState(() => ({
			showChat: true,
			messengerOpenState: MessengerOpenState.open,
			amountOfNewAgentMessagesFound: 0,
		}));

		// Try to re-register the device if it is not yet registered
		this.subscribeDevice();
	};

	hideChat = () => {
		Logger.debug("Hide chat");

		this.setState(() => ({
			showChat: false,
			messengerOpenState: MessengerOpenState.minimize,
		}));
	};

	toggleChat = () => {
		if(this.state.showChat)
			this.hideChat();
		 else
			this.showChat();
	};

	restartPolling = () => {
		// Prevent (re)starting the polling service as long as slow polling is running
		if(this.SlowPollingService.isRunning) {
			Logger.debug("Restart requested of polling service, but slow polling is still running so ignoring this request");
			return;
		}

		this.PollingService.restartPolling();
	};

	handleNewMessage = (eventData) => {
		// Keep track of all the message IDs, so we can show the
		// chat when we received a new message
		let foundNewMessages = false;
		let _amountOfNewAgentMessagesFound = this.state.amountOfNewAgentMessagesFound;
		eventData.detail.data?.forEach((message) => {
			if(!this.messageIDs.has(message.id)) {
				this.messageIDs.add(message.id);
				if(message.typeId === MessageTypes.Agent) {
					localStorage.setItem("lastReceivedAgentMessageId", message.id);
					_amountOfNewAgentMessagesFound++;
				}

				foundNewMessages = true;
			}
		});

		// Show the chat when we received a new message
		if(!this.state.showChat && foundNewMessages) {
			if(this.state.unreadMessagesAction === this.unreadMessagesActions.showMessageCounterBadge) {
				// Update the number for the unread messages badge
				this.setState(() => ({amountOfNewAgentMessagesFound: _amountOfNewAgentMessagesFound}));
			} else {
				this.showChat();
			}
		}
	};

	handleSubscribe = () => {
		// Save registration in the device identification cookie
		// (if the devicePersistence.domain setting is used)
		if(this.state.devicePersistence.domain) {
			Logger.debug("Subscribe done, saving identification in cookie because setting devicePersistence.domain is set");

			this.createDeviceIdentificationCookie(
				this.state.deviceIdentification,
				this.state.devicePersistence.domain,
			);
		}

		Logger.debug("Subscribe done, starting cookie age update interval");
		this.startCookieAgeUpdateInterval(
			this.state.deviceIdentification,
			this.state.devicePersistence.domain,
			this.state.devicePersistence.ageUpdateInterval,
			this.state.devicePersistence.ageUpdateIncrement,
		);
	};

	/**
	 * @param {string} deviceIdentification
	 * @param {string} domain
	 * @param {number} interval
	 * @param {number} increment
	 */
	startCookieAgeUpdateInterval = (deviceIdentification, domain, interval, increment) => {
		// Stop previously running interval before we start a new one
		if(this.cookieAgeRefreshIntervalId !== null)
			this.stopCookieAgeUpdateInterval();


		if(!interval) {
			Logger.debug("Setting devicePersistence.ageUpdateInterval is not set, so not starting cookie age update interval");
			return;
		}

		if(!increment) {
			Logger.debug("Setting devicePersistence.ageUpdateIncrement is not set, so not starting cookie age update interval");
			return;
		}

		const oneSecondInMs = 1000;
		const intervalInSeconds = interval / oneSecondInMs;
		if(intervalInSeconds > increment)
			Logger.warn(`Setting devicePersistence.ageUpdateInterval (${intervalInSeconds} seconds) is greater than devicePersistence.ageUpdateIncrement (${increment} seconds), which will result in the interval not being able to update the cookie in-time before it expires!`);


		// Execute the interval handler once to update the cookie immediately.
		// If any relevant settings change, they will re-start the interval
		// but doing so won't execute the interval body before the delay, only after.
		// So we call it once before we start it.
		this.cookieAgeUpdateIntervalHandler(deviceIdentification, domain, increment);

		this.cookieAgeRefreshIntervalId = window.setInterval(
			() => this.cookieAgeUpdateIntervalHandler(deviceIdentification, domain, increment),
			interval,
		);

		Logger.debug(`Cookie age update interval started with id: ${this.cookieAgeRefreshIntervalId}, interval: ${interval}, increment: ${increment}`);
	};

	stopCookieAgeUpdateInterval = () => {
		window.clearInterval(this.cookieAgeRefreshIntervalId);
	};

	cookieAgeUpdateIntervalHandler = (deviceIdentification, domain, increment) => {
		Logger.debug("Updating cookie with: ", {
			deviceIdentification,
			domain,
			increment,
		});

		this.createDeviceIdentificationCookie(
			deviceIdentification,
			domain,
			increment,
		);
	};

	checkWorkingHours = () => {
		this.setState(prevState => ({offline: !areWeOnline(prevState.workingHours)}), () => {
			Logger.debug(`Offline mode ${this.state.offline ? "enabled" : "disabled"}`);
		});
	};

	saveMessengerOpenState = (messengerOpenState) => {
		Logger.debug(`Saving messengerOpenState value '${messengerOpenState}' into localStorage`);
		localStorage.setItem("messengerOpenState", messengerOpenState);
	};

	/**
	 * Called when a device needs a new identification. This can happen when
	 * the current identification is previously used in a logged-in environment
	 * using an authorization, but now doesn't have that authorization anymore.
	 * The client has chosen to start a new conversation (= new device) by sending
	 * a new message in the Chat.
	 */
	handleDeviceNeedsNewIdentification = () => {
		Logger.debug("Device needs a new identification!");

		// Mark this device as unregistered so that we can subscribe a new device
		this.Api.deviceRegistered = false;

		// This will trigger a new subscribe due to state.deviceIdentification being updated
		this.getDeviceIdentification(true);
	};

	/**
	 * Called when, somehow, the device is not yet registered when trying to send
	 * a message in the Chat.
	 */
	handleDeviceNeedsSubscribing = () => {
		this.subscribeDevice();
	};

	render() {
		return (
			<InterfaceTextsContext.Provider value={this.state.interfaceTexts}>
				{
					!(this.state.offline && this.state.hideChatOutsideWorkingHours)
					&& <Launcher
						amountOfUnreadMessages={this.state.amountOfNewAgentMessagesFound}
						icon={this.state.launcherIcon}
						messengerOpenState={this.state.messengerOpenState}
						onClick={this.handleClick}
					   />
				}
				<Chat
					allowEmoji={true}
					allowMediaUpload={this.state.allowMediaUpload}
					allowedMediaTypes={this.state.allowedMediaTypes}
					api={this.Api}
					closeButton={this.state.closeButton}
					isMobile={this.state.isMobile}
					isiOSMobile={this.state.isiOSMobile}
					onDeviceNeedsNewIdentification={this.handleDeviceNeedsNewIdentification}
					onDeviceNeedsSubscribing={this.handleDeviceNeedsSubscribing}
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
