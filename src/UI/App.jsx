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

		this.Api.subscribeDevice(
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			version,
		);

		this.state = {messageIDs: []};
	}

	componentDidMount() {
		ApiEventTarget.addEventListener(messages, this.handleNewMessage);
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
		const newMessageIDs = [];
		eventData.detail.data.forEach((message) => {
			if(!this.state.messageIDs.includes(message.id))
				newMessageIDs.push(message.id);
		});
		this.setState(prevState => ({messageIDs: prevState.messageIDs.concat(newMessageIDs)}));

		// Show the chat when we received a new message
		if(!this.state.showChat && newMessageIDs.length > 0)
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
