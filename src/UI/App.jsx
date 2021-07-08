import React from "react";
import PropTypes from "prop-types";
import Launcher from "./Launcher";
import Chat from "./Chat";
import Api from "../Api/Api";
import {API_ACCOUNT_IDENTIFICATION, API_DEVICE_IDENTIFICATION, API_DOMAIN} from "./tempConfig";
import ApiEventTarget from "../Api/ApiEventTarget";
import {version} from "../../package.json";
import PollingService from "../Api/Polling";
import {messages} from "../Api/Constants/Events";
import DeviceTypes from "../Api/Constants/DeviceTypes";

export default class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {showChat: false};

		const apiDomain = window.parleySettings && window.parleySettings.apiDomain
			? window.parleySettings.apiDomain
			: API_DOMAIN;
		const accountIdentification = window.parleySettings && window.parleySettings.roomNumber
			? window.parleySettings.roomNumber
			: API_ACCOUNT_IDENTIFICATION;
		const deviceIdentification = window.parleySettings && window.parleySettings.xIrisIdentification
			? window.parleySettings.xIrisIdentification
			: API_DEVICE_IDENTIFICATION;
		const userAdditionalInformation = window.parleySettings && window.parleySettings.userAdditionalInformation
			? window.parleySettings.userAdditionalInformation
			: undefined;

		this.Api = new Api(
			apiDomain,
			accountIdentification,
			deviceIdentification,
			ApiEventTarget,
		);
		this.PollingService = new PollingService(this.Api);
		this.Api.subscribeDevice(
			undefined,
			undefined,
			undefined,
			userAdditionalInformation,
			DeviceTypes.Web,
			version,
		);
		this.messageIDs = new Set();
		this.visibilityChange = "visibilitychange";
	}

	componentDidMount() {
		ApiEventTarget.addEventListener(messages, this.handleNewMessage);
		window.addEventListener("focus", this.handleFocusWindow);

		if(typeof document.hidden !== "undefined")
			document.addEventListener(this.visibilityChange, this.handleVisibilityChange);
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
		const title = "Default Chat - EN";
		const welcomeMessage = "Welcome to our support chat, you can expect a response in ~1 minute.";

		return (
			<>
				<Launcher onClick={this.handleClick} />
				{
					this.state.showChat
					&& <Chat
						allowEmoji={true}
						allowFileUpload={true}
						api={this.Api}
						onMinimizeClick={this.handleClick}
						restartPolling={this.restartPolling}
						title={title}
						welcomeMessage={welcomeMessage}
					   />
				}
			</>
		);
	}
}

App.propTypes = {name: PropTypes.string};
