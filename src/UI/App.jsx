import React from "react";
import PropTypes from "prop-types";
import Launcher from "./Launcher";
import Chat from "./Chat";
import Api from "../Api/Api";
import {API_ACCOUNT_IDENTIFICATION, API_DEVICE_IDENTIFICATION, API_DOMAIN} from "./tempConfig";
import ApiEventTarget from "../Api/ApiEventTarget";
import PollingService from "../Api/Polling";
import {messageSent, subscribe} from "../Api/Constants/Events";
import {version} from "../../package.json";

export default class App extends React.Component {
	constructor(props) {
		super(props);

		// State
		this.state = {showChat: false};
		this.Api = new Api(
			API_DOMAIN,
			API_ACCOUNT_IDENTIFICATION,
			API_DEVICE_IDENTIFICATION,
			ApiEventTarget,
		);
		this.PollingService = new PollingService(this.Api);
	}

	componentDidMount() {
		ApiEventTarget.addEventListener(subscribe, this.handleDeviceSubscribed);
		ApiEventTarget.addEventListener(messageSent, this.handleMessageSent);
	}

	componentWillUnmount() {
		ApiEventTarget.removeEventListener(subscribe, this.handleDeviceSubscribed);

		this.PollingService.stopPolling();
	}

	handleDeviceSubscribed = () => {
		this.PollingService.startPolling();
	}

	handleMessageSent = () => {
		this.PollingService.restartPolling();
	}

	handleClick = () => {
		this.toggleChat();
	}

	toggleChat = () => {
		const isBecomingVisible = !this.state.showChat;
		this.setState(() => ({showChat: isBecomingVisible}));

		if(isBecomingVisible) {
			// TODO: Only register if not yet registered
			// TODO: Handle promise error
			this.Api.subscribeDevice(
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				version,
			);
		}
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
						title={title}
						welcomeMessage={welcomeMessage}
					   />
				}
			</>
		);
	}
}

App.propTypes = {name: PropTypes.string};
