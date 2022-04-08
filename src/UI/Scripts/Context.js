import React from "react";

export const ApiOptions = {
	userAdditionalInformation: {},
	accountIdentification: "0W4qcE5aXoKq9OzvHxj2",
	deviceIdentification: "bbbbbbbbbb",
	apiDomain: "https://api.parley.nu",
	autHeader: undefined,
};

export const InterfaceTexts = {
	english: {
		// New in v2
		buttonMenu: "show options menu",
		buttonMinimize: "hide chat window",
		buttonClose: "stop chat session",
		buttonLauncher: "toggle chat window visibility",
		buttonErrorClose: "hide error",
		messageRetrieveFailed: "Something went wrong while retrieving your messages, please try again later",
		deviceRegistrationFailed: "Something went wrong while registering your device, please try again later",
		serviceGenericError: "Something went wrong, please try again later",

		// Old from v1 (but renamed)
		title: "Messenger", // Was `desc`
		welcomeMessage: "Welcome to our support chat, you can expect a response in ~1 minute.", // Was `infoText`
		inputPlaceholder: "Type your message here...", // Was `placeholderMessenger`
		sendingMessageFailedError: "Something went wrong while sending your message, please try again later", // Was `messageSendFailed`
		serviceUnreachableError: "The service is unreachable at the moment, please try again later", // Was `serviceUnreachableNotification`
	},
	dutch: {
		// New from v2
		buttonMenu: "toon optie menu",
		buttonMinimize: "verberg chat scherm",
		buttonClose: "stop chat sessie",
		buttonLauncher: "chat scherm zichtbaarheid schakelen",
		buttonErrorClose: "verberg foutmelding",
		messageRetrieveFailed: "Er ging iets fout bij het ophalen van je berichten, probeer het later opnieuw",
		deviceRegistrationFailed: "Er ging iets fout bij het registreren van je apparaat, probeer het later opnieuw",
		serviceGenericError: "Er ging iets fout, probeer het later opnieuw",

		// Old from v1 (but renamed)
		title: "Messenger", // Was `desc`
		welcomeMessage: "Welkom bij de support chat, je kan een reactie verwachten binnen ~1 minuut.", // Was `infoText`
		inputPlaceholder: "Typ hier uw bericht...", // Was `placeholderMessenger`
		sendingMessageFailedError: "Er ging iets fout bij het versturen van je bericht, probeer het later opnieuw", // Was `messageSendFailed`
		serviceUnreachableError: "De service is momenteel niet bereikbaar, probeer het later opnieuw", // Was `serviceUnreachableNotification`
	},
};

export const ApiOptionsContext = React.createContext(ApiOptions);
export const InterfaceTextsContext = React.createContext(InterfaceTexts);
