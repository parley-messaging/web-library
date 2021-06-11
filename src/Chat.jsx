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

		this.allowEmoji = false;
		this.allowFileUpload = false;
		this.isMobile = true;
		this.isIosDevice = false; // If true; will correct width/height according to window inner width/height
		this.idName = "chat";
	}

	startCorrection(correction) {
		const intervalTime = 3000;
		const correctionIntervalID = this.startCorrectionInterval(setTimeout(() => {
			clearInterval(correctionIntervalID);
		}, intervalTime), correction);
	}

	startCorrectionInterval(correctionTimeoutID, correction) {
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

		const messenger = document.querySelector("#chat");
		const intervalTime = 25;
		const innerAtStart = getCurrentInner();
		let innerCorrectionStarted = false;

		const correctionIntervalID = setInterval(() => {
			const innerValue = getCurrentInner();

			if(!innerCorrectionStarted) {
				if(inner !== innerValue)
					innerCorrectionStarted = true;
			} else if(inner === innerValue && inner !== innerAtStart) {
				innerCorrectionStarted = false;
				clearInterval(correctionIntervalID);
				clearTimeout(correctionTimeoutID);
			}

			inner = getCurrentInner();
			messenger.style.setProperty(`--mobile-${correction}`, `${inner * 0.01}px`);
		}, intervalTime);

		return correctionIntervalID;
	}

	fitToIDeviceScreen = () => {
		// eslint-disable-next-line no-invalid-this
		if(!this.isIosDevice)
			return;

		const messenger = document.querySelector("#chat");

		// On focus/blur
		if(messenger) {
			// Height
			// eslint-disable-next-line no-invalid-this
			this.startCorrection("height");

			// Width
			// eslint-disable-next-line no-invalid-this
			this.startCorrection("width");
		}
	};

	render() {
		const classNames = `
			${styles.chat} 
			${this.isMobile ? styles.mobile : ""}
			${this.isIosDevice ? styles.ios : ""}
		`;

		return (
			<div className={classNames} id={this.idName}>
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
