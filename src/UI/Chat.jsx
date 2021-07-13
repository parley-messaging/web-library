import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Chat.module.css";
import Header from "./Header";
import Conversation from "./Conversation";
import ReplyActions from "./ReplyActions";
import Api from "../Api/Api";
import ApiEventTarget from "../Api/ApiEventTarget";
import {messages, messageSent} from "../Api/Constants/Events";
import {InterfaceTextsContext} from "./context";
import {ApiFetchFailed, ApiGenericError} from "../Api/Constants/Other";

class Chat extends Component {
	static contextType = InterfaceTextsContext;

	constructor(props) {
		super(props);

		this.isMobile = false;
		this.isIosDevice = false; // If true; will correct width/height according to window inner width/height
		this.idName = "chat";
		this.correctionIntervalID = null;
		this.correctionTimeoutID = null;
		this.chatRef = React.createRef();
		this.replyTextRef = React.createRef();

		this.state = {errorNotification: ""};
	}

	startCorrection(correction, chatNode) {
		const intervalTime = 3000;
		setTimeout(() => {
			clearInterval(this.correctionIntervalID);
		}, intervalTime);
		this.startCorrectionInterval(correction, chatNode);
	}

	startCorrectionInterval(correction, chatNode) {
		let inner;
		let getCurrentInner;
		if(correction === "height") {
			inner = window.innerHeight;
			getCurrentInner = () => window.innerHeight;
		} else if(correction === "width") {
			inner = window.innerWidth;
			getCurrentInner = () => window.innerWidth;
		} else {
			throw new Error("Correction param should be 'width' or 'height'");
		}

		const intervalTime = 25;
		const innerAtStart = getCurrentInner();
		let innerCorrectionStarted = false;

		this.correctionIntervalID = setInterval(() => {
			const oneHundredth = 0.01;
			const innerValue = getCurrentInner();

			if(!innerCorrectionStarted) {
				if(inner !== innerValue)
					innerCorrectionStarted = true;
			} else if(inner === innerValue && inner !== innerAtStart) {
				innerCorrectionStarted = false;
				clearInterval(this.correctionIntervalID);
				clearTimeout(this.correctionTimeoutID);
			}

			inner = getCurrentInner();
			chatNode.style.setProperty(`--mobile-${correction}`, `${inner * oneHundredth}px`);
		}, intervalTime);
	}

	fitToIDeviceScreen = async () => {
		if(!this.isIosDevice)
			return;

		const chatNode = this.chatRef.current;

		// On focus/blur
		if(chatNode) {
			// Height
			this.startCorrection("height", chatNode);

			// Width
			this.startCorrection("width", chatNode);
		}
	};

	componentDidMount() {
		this.replyTextRef.current.textArea.current.focus();

		ApiEventTarget.addEventListener(messageSent, this.handleMessageSent);
		ApiEventTarget.addEventListener(messages, this.handleMessages);
	}

	componentWillUnmount() {
		clearInterval(this.correctionIntervalID);
		clearTimeout(this.correctionTimeoutID);

		ApiEventTarget.removeEventListener(messageSent, this.handleMessageSent);
		ApiEventTarget.removeEventListener(messages, this.handleMessages);
	}

	handleMessageSent = (event) => {
		let error = this.context.messageSendFailed;
		if(event.detail.errorNotifications) {
			if(event.detail.errorNotifications[0] === ApiGenericError)
				error = ApiGenericError;
			if(event.detail.errorNotifications[0] === ApiFetchFailed)
				error = this.context.serviceUnreachableNotification;
		}

		this.setState(() => ({errorNotification: error}));
	}

	handleMessages = (event) => {
		this.setErrorNotifications(event.detail);
	}

	setErrorNotifications = (eventData) => {
		if(eventData.errorNotifications && eventData.errorNotifications.length > 0)
			this.setState(() => ({errorNotification: eventData.errorNotifications[0]}));
	}

	render() {
		let classNames = styles.chat;
		classNames += ` ${this.isMobile ? styles.mobile : ""}`;
		classNames += ` ${this.isIosDevice ? styles.ios : ""}`;

		return (
			<div className={classNames} id={this.idName} ref={this.chatRef}>
				<Header
					onCloseClick={this.props.onCloseClick}
					onMenuClick={this.props.onMenuClick}
					onMinimizeClick={this.props.onMinimizeClick}
					title={this.props.title}
				/>
				<Conversation
					restartPolling={this.props.restartPolling}
					welcomeMessage={this.props.welcomeMessage}
				/>
				{
					this.state.errorNotification.length > 0
					&& <div className={styles.error}>
						{this.state.errorNotification}
					</div>
				}
				<ReplyActions
					allowEmoji={this.allowEmoji}
					allowFileUpload={this.allowFileUpload}
					api={this.props.api}
					fitToIDeviceScreen={this.fitToIDeviceScreen}
					isMobile={this.isMobile}
					replyTextRef={this.replyTextRef}
					restartPolling={this.props.restartPolling}
				/>
			</div>
		);
	}
}

Chat.propTypes = {
	allowEmoji: PropTypes.bool,
	allowFileUpload: PropTypes.bool,
	api: PropTypes.instanceOf(Api),
	onCloseClick: PropTypes.func,
	onMenuClick: PropTypes.func,
	onMinimizeClick: PropTypes.func,
	restartPolling: PropTypes.func,
	title: PropTypes.string,
	welcomeMessage: PropTypes.string,
};

export default Chat;
