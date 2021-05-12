import React, {Component} from "react";
import {apiEventTargetSingleton} from "./Api";
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

		this.apiEventTarget = apiEventTargetSingleton(this.props.apiDomain);
	}

	componentDidMount() {
		// Register event listeners for API events
		this.apiEventTarget.addEventListener(this.apiEventTarget.events.onSubscribe, this.handleOnRegisterEvent);
		this.apiEventTarget.addEventListener(this.apiEventTarget.events.onSendMessage, this.handleOnSendEvent);
		this.apiEventTarget.addEventListener(this.apiEventTarget.events.onGetMessages, this.handleOnRefreshEvent);
	}

	componentWillUnmount() {
		// Un-register event listeners for API events
		this.apiEventTarget.removeEventListener(this.apiEventTarget.events.onSubscribe, this.handleOnRegisterEvent);
		this.apiEventTarget.removeEventListener(this.apiEventTarget.events.onSendMessage, this.handleOnSendEvent);
		this.apiEventTarget.removeEventListener(this.apiEventTarget.events.onGetMessages, this.handleOnRefreshEvent);
	}

	componentDidUpdate() {
		// Update apiEventTarget domain whenever we get a re-render (probably when apiDomain changes)
		this.apiEventTarget.Api.setDomain(this.props.apiDomain);
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
		this.apiEventTarget.subscribeDevice(this.props.accountIdentification, this.props.deviceIdentification);
	}

	handleOnRefreshClick() {
		this.apiEventTarget.getMessages(this.props.accountIdentification, this.props.deviceIdentification);
	}

	handleOnSendClick() {
		this.apiEventTarget.sendMessage(
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
