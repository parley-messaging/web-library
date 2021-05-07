import React, {Component} from "react";
import {apiSingleton} from "./Api";
import PropTypes from "prop-types";
import MessageList from "./MessageList";

class Messaging extends Component {
	constructor(props) {
		super(props);

		this.state = {
			messageInputValue: "",
			messages: [],
		};

		// DOM handlers
		this.handleOnMessageChange = this.handleOnMessageChange.bind(this);
		this.handleOnRegisterClick = this.handleOnRegisterClick.bind(this);
		this.handleOnRefreshClick = this.handleOnRefreshClick.bind(this);
		this.handleOnSendClick = this.handleOnSendClick.bind(this);

		// API Event handlers
		this.handleOnRegisterEvent = this.handleOnRegisterEvent.bind(this);
		this.handleOnSendEvent = this.handleOnSendEvent.bind(this);
		this.handleOnRefreshEvent = this.handleOnRefreshEvent.bind(this);

		this.api = apiSingleton(this.props.apiDomain);
	}

	componentDidMount() {
		// Register event listeners for API events
		this.api.addEventListener(this.api.events.onSubscribe, this.handleOnRegisterEvent);
		this.api.addEventListener(this.api.events.onSendMessage, this.handleOnSendEvent);
		this.api.addEventListener(this.api.events.onGetMessages, this.handleOnRefreshEvent);
	}

	componentWillUnmount() {
		// Un-register event listeners for API events
		this.api.removeEventListener(this.api.events.onSubscribe, this.handleOnRegisterEvent);
		this.api.removeEventListener(this.api.events.onSendMessage, this.handleOnSendEvent);
		this.api.removeEventListener(this.api.events.onGetMessages, this.handleOnRefreshEvent);
	}

	componentDidUpdate() {
		// Update api domain whenever we get a re-render (probably when apiDomain changes)
		this.api.setDomain(this.props.apiDomain);
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
					id={messageInput} onChange={this.handleOnMessageChange} type={inputType}
					value={this.state.messageInputValue}
				/>
				<br />
				<button id={registerButton} onClick={this.handleOnRegisterClick}>{registerButtonText}</button>
				<button id={sendButton} onClick={this.handleOnSendClick}>{sendButtonText}</button>
				<button id={refreshButton} onClick={this.handleOnRefreshClick}>{refreshButtonText}</button>
				<MessageList messages={this.state.messages} />
			</>
		);
	}

	handleOnMessageChange(event) {
		this.setState({messageInputValue: event.target.value});
	}

	handleOnRegisterClick() {
		this.api.subscribeDevice(this.props.accountIdentification, this.props.deviceIdentification);
	}

	handleOnRefreshClick() {
		this.api.getMessages(this.props.accountIdentification, this.props.deviceIdentification);
	}

	handleOnSendClick() {
		this.api.sendMessage(
			this.state.messageInputValue,
			this.props.accountIdentification,
			this.props.deviceIdentification,
		);
	}

	handleOnRegisterEvent(event) {
		// Debug logging
		if(event.detail.status === "ERROR") {
			console.error("onSubscribe event error", event.detail);
			return;
		}
		console.log("onSubscribe event", event.detail);

		// Actual handler
		this.handleOnRefreshClick();
	}

	handleOnRefreshEvent(event) {
		// Debug logging
		if(event.detail.status === "ERROR") {
			console.error("onGetMessages event error", event.detail);
			return;
		}
		console.log("onGetMessages event", event.detail);

		// Actual handler
		this.setState({messages: event.detail.data});
	}

	handleOnSendEvent(event) {
		// Debug logging
		if(event.detail.status === "ERROR") {
			console.error("onSendMessage event error", event.detail);
			return;
		}
		console.log("onSendMessage event", event.detail);

		// Actual handler
		this.handleOnRefreshClick();
	}
}

Messaging.propTypes = {
	deviceIdentification: PropTypes.string,
	accountIdentification: PropTypes.string,
	apiDomain: PropTypes.string,
};

export default Messaging;
