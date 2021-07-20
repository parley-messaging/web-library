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
		// TODO: Add to docs
		// New in v2
		buttonMenu: "show options menu",
		buttonMinimize: "hide chat window",
		buttonClose: "stop chat session",
		buttonLauncher: "toggle chat window visibility",
		messageRetrieveFailed: "Something went wrong while retrieving your messages, please try again later",
		deviceRegistrationFailed: "Something went wrong while registering your device, please try again later",

		// Old from v1
		desc: "Messenger",
		infoText: "Welcome to our support chat, you can expect a response in ~1 minute.",
		placeholderMessenger: "Type your message here...",
		messageSendFailed: "Something went wrong while sending your message, please try again later",
		serviceUnreachableNotification: "The service is unreachable at the moment, please try again later",
	},
	dutch: {
		// TODO: Add to docs
		// New from v2
		buttonMenu: "toon optie menu",
		buttonMinimize: "verberg chat scherm",
		buttonClose: "stop chat sessie",
		buttonLauncher: "chat scherm zichtbaarheid schakelen",
		messageRetrieveFailed: "Er ging iets fout bij het ophalen van je berichten, probeer het later opnieuw",
		deviceRegistrationFailed: "Er ging iets fout bij het registreren van je apparaat, probeer het later opnieuw",

		// Old from v1
		desc: "Messenger",
		infoText: "Welkom bij de support chat, je kan een reactie verwachten binnen ~1 minuut.",
		placeholderMessenger: "Typ hier uw bericht...",
		messageSendFailed: "Er ging iets fout bij het versturen van je bericht, probeer het later opnieuw",
		serviceUnreachableNotification: "De service is momenteel niet bereikbaar, probeer het later opnieuw",
	},
};

export const ApiOptionsContext = React.createContext(ApiOptions);
export const InterfaceTextsContext = React.createContext(InterfaceTexts);
