import React from "react";
import {v4 as uuidv4} from "uuid";

const secondsToMS = 1000;

export const ApiOptions = {
	userAdditionalInformation: {},
	accountIdentification: "0cce5bfcdbf07978b269",
	generateDeviceIdentification: uuidv4,
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
		ariaLabelButtonMinimize: "hide chat window",
		ariaLabelButtonClose: "stop chat session",
		ariaLabelButtonLauncher: "toggle chat window visibility",
		ariaLabelButtonErrorClose: "hide error",
		ariaLabelTextInput: "message input field",
		ariaLabelMessageTitle: "message title",
		ariaLabelMessageBody: "message body",
		ariaLabelMessageMedia: "message media",
		ariaLabelMessageButtons: "message buttons",
		serviceGenericError: "Something went wrong, please try again later",
		deviceRequiresAuthorizationError: "This conversation is continued in a logged-in environment, go back to that environment if you want to continue the conversation. Send a new message below if you want to start a new conversation.",
		subscribeDeviceFailedError: "Something went wrong while registering your device, please re-open the chat to try again",
		retrievingMessagesFailedError: "Something went wrong while retrieving your messages, please re-open the chat if this keeps happening",
		uploadMediaNotUploadedError: "Something went wrong while uploading this file, please try again later",
		ariaLabelUploadFile: "Upload file",
		screenReaderNewMessageAnnouncement: (agentName, message, time) => `On ${new Date(time * secondsToMS).toLocaleTimeString(undefined, {
			hour12: false,
			timeStyle: "short",
		})} ${agentName} says: ${message}`,
		noMessagesInConversation: "There are no messages sent yet in this conversation",

		// Old from v1 (but renamed)
		title: "Messenger", // Was `desc`
		welcomeMessage: "How can we help you?", // Was `infoText`
		inputPlaceholder: "Type your message here...", // Was `placeholderMessenger`
		sendingMessageFailedError: "Something went wrong while sending your message, please try again later", // Was `messageSendFailed`
		serviceUnreachableError: "The service is unreachable at the moment, please try again later", // Was `serviceUnreachableNotification`
		uploadMediaInvalidTypeError: "You can not upload this type of file", // Was `imageFormatIncorrect` (is now used for all media files)
		uploadMediaTooLargeError: "You can not upload files with sizes that exceed the 10mb limit", // Was `imageTooBig` (is now used for all media files)
	},
	dutch: {
		// New in v2
		ariaLabelButtonMenu: "toon optie menu",
		ariaLabelButtonMinimize: "verberg chat scherm",
		ariaLabelButtonClose: "stop chat sessie",
		ariaLabelButtonLauncher: "chat scherm zichtbaarheid schakelen",
		ariaLabelButtonErrorClose: "verberg foutmelding",
		ariaLabelTextInput: "bericht invoerveld",
		ariaLabelMessageTitle: "bericht titel",
		ariaLabelMessageBody: "bericht inhoud",
		ariaLabelMessageMedia: "bericht media",
		ariaLabelMessageButtons: "bericht knoppen",
		serviceGenericError: "Er ging iets fout, probeer het later opnieuw",
		deviceRequiresAuthorizationError: "Dit gesprek is verdergegaan in een ingelogde omgeving, wil je verder met dat gesprek ga dan terug naar die omgeving. Wil je een nieuw gesprek starten, stuur dan hieronder je bericht.",
		subscribeDeviceFailedError: "Er ging iets fout met het registreren van je apparaat, open de chat opnieuw om het nog een keer te proberen",
		retrievingMessagesFailedError: "Er ging iets fout bij het ophalen van je berichten, open de chat opnieuw als dit zich voor blijft doen",
		uploadMediaNotUploadedError: "Er ging iets fout tijdens het uploaden, probeer het later opnieuw",
		ariaLabelUploadFile: "Bestand uploaden",
		screenReaderNewMessageAnnouncement: (agentName, message, time) => `Om ${new Date(time * secondsToMS).toLocaleTimeString(undefined, {
			hour12: false,
			timeStyle: "short",
		})} ${agentName} zegt: ${message}`,
		noMessagesInConversation: "Er zijn nog geen berichten verstuurd in deze conversatie",

		// Old from v1 (but renamed)
		title: "Messenger", // Was `desc`
		welcomeMessage: "Hoe kunnen we u helpen?", // Was `infoText`
		inputPlaceholder: "Typ hier uw bericht...", // Was `placeholderMessenger`
		sendingMessageFailedError: "Er ging iets fout bij het versturen van je bericht, probeer het later opnieuw", // Was `messageSendFailed`
		serviceUnreachableError: "De service is momenteel niet bereikbaar, probeer het later opnieuw", // Was `serviceUnreachableNotification`
		uploadMediaInvalidTypeError: "Je kan dit type bestand niet uploaden", // Was `imageFormatIncorrect` (is now used for all media files)
		uploadMediaTooLargeError: "Je kan geen bestanden uploaden die groter zijn dan 10mb", // Was `imageTooBig` (is now used for all media files)
	},
};

export const ApiOptionsContext = React.createContext(ApiOptions);
export const InterfaceTextsContext = React.createContext(InterfaceTexts);
