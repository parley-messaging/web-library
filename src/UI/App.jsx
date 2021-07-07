import {config} from "@fortawesome/fontawesome-svg-core";

// Make sure this is before any other `fontawesome` API calls
// This will disable the automatic css insertion
// More info: https://fontawesome.com/v5.15/how-to-use/on-the-web/other-topics/security
config.autoAddCss = false;

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
import pageVisibilityApi from "./pageVisibilityApi";

export default class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {showChat: false};

		this.Api = new Api(
			API_DOMAIN,
			API_ACCOUNT_IDENTIFICATION,
			API_DEVICE_IDENTIFICATION,
			ApiEventTarget,
		);
		this.PollingService = new PollingService(this.Api);
		this.Api.subscribeDevice(
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			version,
		);
		this.messageIDs = [];
	}

	componentDidMount() {
		ApiEventTarget.addEventListener(messages, this.handleNewMessage);
		document.addEventListener(pageVisibilityApi.visibilityChange, this.handleVisibilityChange);
		window.addEventListener("focus", this.handleFocusWindow);
	}

	componentWillUnmount() {
		ApiEventTarget.removeEventListener(messages, this.handleNewMessage);
		document.removeEventListener(pageVisibilityApi.visibilityChange, this.handleVisibilityChange);
		window.removeEventListener("focus", this.handleFocusWindow);

		// Stop polling and remove any event listeners created by the Polling Service
		this.PollingService.stopPolling();
	}

	handleFocusWindow = () => {
		// Restart polling when window receives focus
		this.PollingService.restartPolling();
	}

	handleVisibilityChange = () => {
		// Restart polling when page is becoming visible
		if(!document[pageVisibilityApi.hidden])
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
			if(!this.messageIDs.includes(message.id)) {
				this.messageIDs.push(message.id);
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
