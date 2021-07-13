import React from "react";

export const ApiOptions = {
	userAdditionalInformation: {},
	accountIdentification: "0W4qcE5aXoKq9OzvHxj2",
	deviceIdentification: "bbbbbbbbbb",
	apiDomain: "https://api.parley.nu",
	autHeader: undefined,
};

export const InterfaceTexts = {
	buttonMenu: "show options menu",
	buttonMinimize: "hide chat window",
	buttonClose: "stop chat session",
	buttonLauncher: "toggle chat window visibility",
	desc: "Messenger",
	infoText: "Welcome to our support chat, you can expect a response in ~1 minute.",
	placeholderMessenger: "Type here your message...",
	messageSendFailed: "Something went wrong while sending your message, please try again later",
	serviceUnreachableNotification: "The service is unreachable at the moment, please try again later",
};

export const ApiOptionsContext = React.createContext(ApiOptions);
export const InterfaceTextsContext = React.createContext(InterfaceTexts);
