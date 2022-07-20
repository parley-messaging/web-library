import React from "react";
import {v4 as uuidv4} from "uuid";

export const ApiOptions = {
	userAdditionalInformation: {},
	accountIdentification: "0W4qcE5aXoKq9OzvHxj2",
	deviceIdentification: JSON.parse(localStorage.getItem("deviceInformation"))?.deviceIdentification || uuidv4(),
	apiDomain: "https://api.parley.nu",
	autHeader: undefined,
};

/**
 * Default texts for the UI
 */
export const InterfaceTexts = {
	english: {
		// New in v2
		ariaLabelButtonMenu: "show options menu",
		ariaLabelButtonMenuClose: "show or hide options menu",
		ariaLabelButtonMinimize: "hide chat window",
		ariaLabelButtonClose: "stop chat session",
		ariaLabelButtonLauncher: "toggle chat window visibility",
		ariaLabelButtonErrorClose: "hide error",
		ariaLabelTextInput: "message ariaLabelTextInput field",
		messageRetrieveFailed: "Something went wrong while retrieving your messages, please try again later",
		deviceRegistrationFailed: "Something went wrong while registering your device, please try again later",
		serviceGenericError: "Something went wrong, please try again later",

		// Old from v1 (but renamed)
		title: "Messenger", // Was `desc`
		welcomeMessage: "How can we help you?", // Was `infoText`
		inputPlaceholder: "Type your message here...", // Was `placeholderMessenger`
		sendingMessageFailedError: "Something went wrong while sending your message, please try again later", // Was `messageSendFailed`
		serviceUnreachableError: "The service is unreachable at the moment, please try again later", // Was `serviceUnreachableNotification`
		subscribeDeviceFailedError: "Something went wrong while registering your device, please re-open the chat to try again", // New in v2
		retrievingMessagesFailedError: "Something went wrong while retrieving your messages, please re-open the chat if this keeps happening", // New in v2
		downloadTranscript: "Download conversation", // New in v2
		aboutApp: "About this app", // New in v2
	},
	dutch: {
		// New from v2
		ariaLabelButtonMenu: "toon optie menu",
		ariaLabelButtonMenuClose: "toon of sluit optie menu",
		ariaLabelButtonMinimize: "verberg chat scherm",
		ariaLabelButtonClose: "stop chat sessie",
		ariaLabelButtonLauncher: "chat scherm zichtbaarheid schakelen",
		ariaLabelButtonErrorClose: "verberg foutmelding",
		ariaLabelTextInput: "bericht invoerveld",
		messageRetrieveFailed: "Er ging iets fout bij het ophalen van je berichten, probeer het later opnieuw",
		deviceRegistrationFailed: "Er ging iets fout bij het registreren van je apparaat, probeer het later opnieuw",
		serviceGenericError: "Er ging iets fout, probeer het later opnieuw",

		// Old from v1 (but renamed)
		title: "Messenger", // Was `desc`
		welcomeMessage: "Hoe kunnen we u helpen?", // Was `infoText`
		inputPlaceholder: "Typ hier uw bericht...", // Was `placeholderMessenger`
		sendingMessageFailedError: "Er ging iets fout bij het versturen van je bericht, probeer het later opnieuw", // Was `messageSendFailed`
		serviceUnreachableError: "De service is momenteel niet bereikbaar, probeer het later opnieuw", // Was `serviceUnreachableNotification`
		subscribeDeviceFailedError: "Er ging iets fout met het registreren van je apparaat, open de chat opnieuw om het nog een keer te proberen", // New in v2
		retrievingMessagesFailedError: "Er ging iets fout bij het ophalen van je berichten, open de chat opnieuw als dit zich voor blijft doen", // New in v2
		downloadTranscript: "Download conversatie", // New in v2
		aboutApp: "Over deze app", // New in v2
	},
};

export const ApiOptionsContext = React.createContext(ApiOptions);
export const InterfaceTextsContext = React.createContext(InterfaceTexts);
