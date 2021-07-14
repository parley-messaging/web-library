import React from "react";
import PropTypes from "prop-types";
import Launcher from "./Launcher";
import Chat from "./Chat";
import Api from "../Api/Api";
import ApiEventTarget from "../Api/ApiEventTarget";
import {version} from "../../package.json";
import PollingService from "../Api/Polling";
import {messages} from "../Api/Constants/Events";
import DeviceTypes from "../Api/Constants/DeviceTypes";
import {ApiOptions, InterfaceTexts, InterfaceTextsContext} from "./context";

export default class App extends React.Component {
	static contextType = InterfaceTextsContext;

	constructor(props) {
		super(props);

		this.state = {
			showChat: false,
			interfaceTexts: InterfaceTexts.english, // TODO: Check prefered language and change accordingly
		};

		this.Api = new Api(
			ApiOptions.apiDomain,
			ApiOptions.accountIdentification,
			ApiOptions.deviceIdentification,
			ApiEventTarget,
		);
		this.PollingService = new PollingService(this.Api);
		this.Api.subscribeDevice(
			undefined,
			undefined,
			undefined,
			undefined,
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
		return (
			<InterfaceTextsContext.Provider value={this.state.interfaceTexts}>
				<Launcher onClick={this.handleClick} />
				{
					this.state.showChat
						&& <Chat
							allowEmoji={true}
							allowFileUpload={true}
							api={this.Api}
							closeButton={this.state.closeButton}
							onMinimizeClick={this.handleClick}
							restartPolling={this.restartPolling}
							title={this.context.desc}
							welcomeMessage={this.context.infoText}
						   />
				}
			</InterfaceTextsContext.Provider>
		);
	}
}

App.propTypes = {name: PropTypes.string};
