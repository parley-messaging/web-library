import React, {Component} from "react";
import PropTypes from "prop-types";
import MessageList from "./MessageList";
import {Events} from "./Api/Constants";
import Api from "./Api/Api";
import ApiEventTarget from "./Api/ApiEventTarget";

class Messaging extends Component {
	constructor(props) {
		super(props);

		this.state = {
			messageInputValue: "",
			messages: [],
		};

		this.Api = new Api(this.props.apiDomain, ApiEventTarget);
	}

	componentDidMount() {
		// Register event listeners for API events
		ApiEventTarget.addEventListener(Events.onSubscribe, this.handleRegisterEvent);
		ApiEventTarget.addEventListener(Events.onSendMessage, this.handleSendEvent);
		ApiEventTarget.addEventListener(Events.onGetMessages, this.handleRefreshEvent);
	}

	componentWillUnmount() {
		// Un-register event listeners for API events
		ApiEventTarget.removeEventListener(Events.onSubscribe, this.handleRegisterEvent);
		ApiEventTarget.removeEventListener(Events.onSendMessage, this.handleSendEvent);
		ApiEventTarget.removeEventListener(Events.onGetMessages, this.handleRefreshEvent);
	}

	componentDidUpdate() {
		// Update Api domain whenever we get a re-render (probably when apiDomain changes)
		this.Api.setDomain(this.props.apiDomain);
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
		this.Api.subscribeDevice(
			this.props.accountIdentification,
			this.props.deviceIdentification,
			this.props.pushToken,
			this.props.pushType,
			this.props.pushEnabled,
			this.props.userAdditionalInformation,
			this.props.type,
			this.props.version,
			this.props.referer,
		)
			.catch((error) => {
				// Example of how you can catch api errors
				console.error(`Error from API request: ${error}`);
			});
	}

	handleRefreshClick = () => {
		this.Api.getMessages(this.props.accountIdentification, this.props.deviceIdentification)
			.catch((error) => {
				console.error(`Error from API request: ${error}`);
			});
	}

	handleSendClick = () => {
		this.Api.sendMessage(
			this.state.messageInputValue,
			this.props.accountIdentification,
			this.props.deviceIdentification,
		)
			.catch((error) => {
				console.error(`Error from API request: ${error}`);
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
