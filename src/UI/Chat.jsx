import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Chat.module.css";
import Header from "./Header";
import Conversation from "./Conversation";
import ReplyActions from "./ReplyActions";
import Api from "../Api/Api";
import ApiEventTarget from "../Api/ApiEventTarget";
import {messages, messageSent, subscribe} from "../Api/Constants/Events";
import {InterfaceTextsContext} from "./Scripts/Context";
import {ApiFetchFailed, ApiGenericError} from "../Api/Constants/Other";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons/faTimes";

class Chat extends Component {
	static contextType = InterfaceTextsContext;

	constructor(props) {
		super(props);

		this.isMobile = this.props.isMobile || false; // If true; will add mobile styling to render
		this.isiOSDevice = this.props.isiOSMobile || false; // If true; will correct width/height according to window inner width/height

		this.idName = "chat";
		this.correctionIntervalID = null;
		this.correctionTimeoutID = null;
		this.chatRef = React.createRef();
		this.replyTextRef = React.createRef();
		this.replyActionsRef = React.createRef();

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
			chatNode.style.setProperty(`--parley-mobile-${correction}`, `${inner * oneHundredth}px`);
		}, intervalTime);
	}

	fitToIDeviceScreen = async () => {
		if(!this.isiOSDevice)
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
		ApiEventTarget.addEventListener(subscribe, this.handleSubscribe);
	}

	componentWillUnmount() {
		clearInterval(this.correctionIntervalID);
		clearTimeout(this.correctionTimeoutID);

		ApiEventTarget.removeEventListener(messageSent, this.handleMessageSent);
		ApiEventTarget.removeEventListener(messages, this.handleMessages);
		ApiEventTarget.removeEventListener(subscribe, this.handleSubscribe);
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		// Focus input field if chat was hidden but is now shown
		if(prevProps.showChat !== this.props.showChat && this.props.showChat === true)
			this.replyTextRef.current.textArea.current.focus();
	}

	handleMessageSent = (event) => {
		// If we have any errors, show them to the client
		if(event.detail.errorNotifications)
			this.setErrorNotifications(event, this.context.sendingMessageFailedError);
	};

	handleMessages = (event) => {
		// If we have any errors, show them to the client
		if(event.detail.errorNotifications)
			this.setErrorNotifications(event, this.context.retrievingMessagesFailedError);
	};

	handleSubscribe = (event) => {
		// If we have any errors, show them to the client
		if(event.detail.errorNotifications)
			this.setErrorNotifications(event, this.context.subscribeDeviceFailedError);
	};

	setErrorNotifications = (event, defaultError) => {
		// Choose the default error if set
		// otherwise take the first error, from the notifications, as the default
		let error = defaultError || event.detail.errorNotifications[0];

		if(event.detail.errorNotifications[0] === ApiGenericError) {
			error = this.context.serviceGenericError;
		} else if(event.detail.errorNotifications[0] === ApiFetchFailed) {
			// This is an error due to the service being unreachable
			error = this.context.serviceUnreachableError;
		} else if(event.detail.errorNotifications[0] === "device_requires_authorization") {
			// This is an error due to trying to downgrade a logged-in device
			// to an anonymous device
			error = this.context.deviceRequiresAuthorizationError;

			// Mark the device as unregistered, so that the ReplyActions
			// will trigger a new subscribe event.
			// This will also stop the polling.
			this.props.api.deviceRegistered = false;
		}

		// Save the error in the state, so we can show it in the next update
		this.setState(() => ({errorNotification: error}));
	};

	handleErrorCloseButtonClick = () => {
		this.setState(() => ({errorNotification: undefined}));
	};

	handleDeviceNeedsSubscribing = () => {
		if(this.state.errorNotification === this.context.deviceRequiresAuthorizationError) {
			// Device is not subscribed and needs to be, but it HAS to be a new identification
			this.props.onDeviceNeedsNewIdentification();
		} else {
			// Device is not subscribed and needs to be
			this.props.onDeviceNeedsSubscribing();
		}
	}

	handleSentSuccessfully = () => {
		if(this.state.errorNotification === this.context.deviceRequiresAuthorizationError) {
			// After the message was submitted, we should close this specific error
			// because it is no longer relevant
			this.handleErrorCloseButtonClick();
		}
	}

	render() {
		let classNames = styles.chat;
		classNames += ` ${this.isMobile ? styles.mobile : ""}`;
		classNames += ` ${this.isiOSDevice ? styles.ios : ""}`;
		classNames += ` ${this.props.showChat ? "" : styles.hidden}`;
		const typeButton = "button";

		return (
			<div className={classNames} id={this.idName} ref={this.chatRef}>
				<Header
					onCloseClick={this.props.onCloseClick}
					onMenuClick={this.props.onMenuClick}
					onMinimizeClick={this.props.onMinimizeClick}
					title={this.props.title}
				/>
				<Conversation
					api={this.props.api}
					defaultWelcomeMessage={this.props.welcomeMessage}
					restartPolling={this.props.restartPolling}
				/>
				{
					this.state.errorNotification && this.state.errorNotification.length > 0
					&& <div className={styles.error}>
						<span className={styles.errorText}>
							{this.state.errorNotification}
						</span>
						<button
							aria-label={this.context.ariaLabelButtonErrorClose}
							className={styles.closeButton}
							onClick={this.handleErrorCloseButtonClick}
							type={typeButton}
						>
							<FontAwesomeIcon icon={faTimes} />
						</button>
					</div>
				}
				<ReplyActions
					allowEmoji={this.allowEmoji}
					allowFileUpload={this.allowFileUpload}
					api={this.props.api}
					fitToIDeviceScreen={this.fitToIDeviceScreen}
					isMobile={this.isMobile}
					onDeviceNeedsSubscribing={this.handleDeviceNeedsSubscribing}
					onSentSuccessfully={this.handleSentSuccessfully}
					ref={this.replyActionsRef}
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
	isiOSMobile: PropTypes.bool,
	isMobile: PropTypes.bool,
	onCloseClick: PropTypes.func,
	onDeviceNeedsNewIdentification: PropTypes.func,
	onDeviceNeedsSubscribing: PropTypes.func,
	onMenuClick: PropTypes.func,
	onMinimizeClick: PropTypes.func,
	restartPolling: PropTypes.func,
	showChat: PropTypes.bool,
	title: PropTypes.string,
	welcomeMessage: PropTypes.string,
};

export default Chat;
