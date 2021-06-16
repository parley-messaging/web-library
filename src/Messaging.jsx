import React, {Component} from "react";
import PropTypes from "prop-types";
import MessageList from "./MessageList";
import {messages, messageSend, subscribe} from "./Api/Constants/Events";
import Api from "./Api/Api";
import ApiEventTarget from "./Api/ApiEventTarget";

class Messaging extends Component {
	constructor(props) {
		super(props);

		this.state = {
			messageInputValue: "",
			messages: [],
		};

		this.Api = new Api(
			this.props.apiDomain,
			this.props.accountIdentification,
			this.props.deviceIdentification,
			ApiEventTarget,
		);
	}

	componentDidMount() {
		// Register event listeners for API events
		ApiEventTarget.addEventListener(subscribe, this.handleRegisterEvent);
		ApiEventTarget.addEventListener(messageSend, this.handleSendEvent);
		ApiEventTarget.addEventListener(messages, this.handleRefreshEvent);
	}

	componentWillUnmount() {
		// Un-register event listeners for API events
		ApiEventTarget.removeEventListener(subscribe, this.handleRegisterEvent);
		ApiEventTarget.removeEventListener(messageSend, this.handleSendEvent);
		ApiEventTarget.removeEventListener(messages, this.handleRefreshEvent);
	}

	render() {
		const header = "Messaging";
		const inputType = "text";
		const messageInput = "message";
		const messageLabel = "Message: ";
		const registerButton = "register";
		const registerButtonText = "Register";
		const sendButton = "send";
		const sendButtonText = "Send";
		const refreshButton = "refresh";
		const refreshButtonText = "Refresh";
		return (
			<>
				<h1>{header}</h1>
				<label htmlFor={messageInput}>{messageLabel}</label>
				<input
					id={messageInput} onChange={this.handleMessageChange} type={inputType}
					value={this.state.messageInputValue}
				/>
				<br />
				<button id={registerButton} onClick={this.handleRegisterClick}>{registerButtonText}</button>
				<button id={sendButton} onClick={this.handleSendClick}>{sendButtonText}</button>
				<button id={refreshButton} onClick={this.handleRefreshClick}>{refreshButtonText}</button>
				<MessageList messages={this.state.messages} />
			</>
		);
	}

	handleMessageChange = (event) => {
		this.setState({messageInputValue: event.target.value});
	}

	handleRegisterClick = () => {
		// Makes sure that we always use the up-to-date props
		this.updateApiParams();

		this.Api.subscribeDevice(
			this.props.pushToken,
			this.props.pushType,
			this.props.pushEnabled,
			this.props.userAdditionalInformation,
			this.props.type,
			this.props.version,
			this.props.referer,
		)
			.catch((errors, warnings) => {
				// Example of how you can catch api errors
				// eslint-disable-next-line no-console
				console.error(`Errors from API request`, errors);
				// eslint-disable-next-line no-console
				console.error(`Warnings from API request:`, warnings);
			});
	}

	handleRefreshClick = () => {
		this.Api.getMessages()
			.catch((errors, warnings) => {
				// eslint-disable-next-line no-console
				console.error(`Errors from API request`, errors);
				// eslint-disable-next-line no-console
				console.error(`Warnings from API request:`, warnings);
			});
	}

	handleSendClick = () => {
		this.Api.sendMessage(this.state.messageInputValue)
			.catch((errors, warnings) => {
				// eslint-disable-next-line no-console
				console.error(`Errors from API request`, errors);
				// eslint-disable-next-line no-console
				console.error(`Warnings from API request:`, warnings);
			});
	}

	handleRegisterEvent = (event) => {
		// Debug logging
		if(event.detail.status === "ERROR") {
			throw new Error(`onRegister event error: ${event.detail}`);
		}

		// Actual handler
		this.handleRefreshClick();
	}

	handleRefreshEvent = (event) => {
		// Debug logging
		if(event.detail.status === "ERROR") {
			throw new Error(`onRefresh event error: ${event.detail}`);
		}

		// Actual handler
		this.setState({messages: event.detail.data});
	}

	handleSendEvent = (event) => {
		// Debug logging
		if(event.detail.status === "ERROR") {
			throw new Error(`onSendMessage event error: ${event.detail}`);
		}

		// Actual handler
		this.handleRefreshClick();
	}

	updateApiParams = () => {
		this.Api.setDomain(this.props.apiDomain);
		this.Api.setAccountIdentification(this.props.accountIdentification);
		this.Api.setDeviceIdentification(this.props.deviceIdentification);
	}
}

Messaging.propTypes = {
	accountIdentification: PropTypes.string,
	apiDomain: PropTypes.string,
	deviceIdentification: PropTypes.string,
	onChange: PropTypes.func,
	pushEnabled: PropTypes.bool,
	pushToken: PropTypes.string,
	pushType: PropTypes.number,
	referer: PropTypes.string,
	type: PropTypes.number,
	userAdditionalInformation: PropTypes.object,
	version: PropTypes.string,
};

export default Messaging;
