import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Chat.module.css";

// components
import Header from "./Header";
import Conversation from "./Conversation";
import ReplyActions from "./ReplyActions";

class Chat extends Component {
	constructor(props) {
		super(props);

		this.isMobile = false;
		this.isIosDevice = false; // If true; will correct width/height according to window inner width/height
		this.idName = "chat";
		this.correctionIntervalID = null;
		this.correctionTimeoutID = null;
		this.chatRef = React.createRef();
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

		// TODO: Somehow fix this so that we don't have to wait for chatRef to be != null
		// It seems that once this is called, chatRef.current = null
		// React docs https://reactjs.org/docs/refs-and-the-dom.html#adding-a-ref-to-a-dom-element
		// say that the ref is set when the component mounts, but that doesn't seem to happen
		const chatNode = await new Promise((resolve) => {
			const intervalID = setInterval(() => {
				console.log("Waiting for chatRef.current...");
				if(this.chatRef.current !== null) {
					clearInterval(intervalID);
					resolve(this.chatRef.current);
				}
			});
		});

		// On focus/blur
		if(chatNode) {
			// Height
			this.startCorrection("height", chatNode);

			// Width
			this.startCorrection("width", chatNode);
		}
	};

	componentWillUnmount() {
		clearInterval(this.correctionIntervalID);
		clearTimeout(this.correctionTimeoutID);
	}

	render() {
		const classNames = `
			${styles.chat} 
			${this.isMobile ? styles.mobile : ""}
			${this.isIosDevice ? styles.ios : ""}
		`;

		return (
			<div className={classNames} id={this.idName} ref={this.chatRef}>
				<Header
					closeAction={this.props.closeAction}
					menuAction={this.props.menuAction}
					minimizeAction={this.props.minimizeAction}
					title={this.props.title}
				/>
				<Conversation welcomeMessage={this.props.welcomeMessage} />
				<ReplyActions
					allowEmoji={this.allowEmoji}
					allowFileUpload={this.allowFileUpload}
					fitToIDeviceScreen={this.fitToIDeviceScreen}
					isMobile={this.isMobile}
				/>
			</div>
		);
	}
}

Chat.propTypes = {
	allowEmoji: PropTypes.bool,
	allowFileUpload: PropTypes.bool,
	closeAction: PropTypes.func,
	menuAction: PropTypes.func,
	minimizeAction: PropTypes.func,
	title: PropTypes.string,
	welcomeMessage: PropTypes.string,
};

export default Chat;
