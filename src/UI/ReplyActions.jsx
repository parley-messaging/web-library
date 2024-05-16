import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./ReplyActions.module.css";
import ReplyText from "./ReplyText";
import Api from "../Api/Api";
import {InterfaceTextsContext} from "./Scripts/Context";
import ApiEventTarget from "../Api/ApiEventTarget";
import {subscribe} from "../Api/Constants/Events";
import MobileSubmit from "./Buttons/MobileSubmit";
import UploadMedia from "./Buttons/UploadMedia";

class ReplyActions extends Component {
	constructor(props) {
		super(props);

		this.state = {reply: ""};
	}

	/**
	 * @param {File} file
	 */
	handleFileChange = (file) => {
		if(this.props.api.deviceRegistered) {
			this.uploadMedia(file);
		} else {
			// Wait until device is subscribed before trying to send a message
			const handleSubscribe = (event) => {
				if(!event.detail.errorNotifications)
					this.uploadMedia(file);

				// This is a one time thing (for this submit),
				// so stop listening for future subscriptions
				ApiEventTarget.removeEventListener(subscribe, handleSubscribe);
			};
			ApiEventTarget.addEventListener(subscribe, handleSubscribe);

			this.props.onDeviceNeedsSubscribing();
		}
	};

	handleChange = (event) => {
		this.setState(() => ({reply: event.target.value}));
	}

	uploadMedia = file => this.props.api.uploadMedia(file)
		.then((data) => {
			if(!data)
				return; // This means the upload failed. The error will be handled by Chat.jsx

			this.props.api.sendMedia(data.data.media, file.name)
				.then(() => {
					this.props.onSentSuccessfully();
				})
				.finally(() => {
					// After re-enabling the focus must be set again
					this.props.replyTextRef.current.textArea.current.focus();
				});
		})

	handleSubmit = () => {
		if(this.state.reply === "")
			return; // Don't send empty messages

		// While sending the message we don't want the user to keep
		// trying to send this message by submitting the input field,
		// so we disable it until we get a response from the API
		this.props.replyTextRef.current.textArea.current.disabled = true;

		if(this.props.api.deviceRegistered) {
			this.sendMessage();
		} else {
			// Wait until device is subscribed before trying to send a message
			const handleSubscribe = (event) => {
				if(!event.detail.errorNotifications)
					this.sendMessage();

				// This is a one time thing (for this submit),
				// so stop listening for future subscriptions
				ApiEventTarget.removeEventListener(subscribe, handleSubscribe);
			};
			ApiEventTarget.addEventListener(subscribe, handleSubscribe);

			this.props.onDeviceNeedsSubscribing();
		}
	}

	sendMessage = () => this.props.api.sendMessage(this.state.reply)
		.then(() => {
			// Reset state
			this.setState(() => ({reply: ""}));

			this.props.onSentSuccessfully();
		})
		.finally(() => {
			this.props.replyTextRef.current.textArea.current.disabled = false;

			// After re-enabling the focus must be set again
			this.props.replyTextRef.current.textArea.current.focus();
		})

	render() {
		return (
			<InterfaceTextsContext.Consumer>
				{
					interfaceTexts => (
						<div className={styles.footer}>
							<ReplyText
								fitToIDeviceScreen={this.props.fitToIDeviceScreen}
								isMobile={this.props.isMobile}
								onChange={this.handleChange}
								onSubmit={this.handleSubmit}
								placeholder={interfaceTexts.inputPlaceholder}
								ref={this.props.replyTextRef}
								restartPolling={this.props.restartPolling}
								value={this.state.reply}
							/>
							<div className={styles.actions}>
								{
									this.props.isMobile && this.state.reply !== ""
									? <MobileSubmit onClick={this.handleSubmit} />
									: <UploadMedia
											onChange={this.handleFileChange}
									  />
								}
							</div>
						</div>
					)
				}
			</InterfaceTextsContext.Consumer>
		);
	}
}

ReplyActions.propTypes = {
	allowEmoji: PropTypes.bool,
	allowFileUpload: PropTypes.bool,
	api: PropTypes.instanceOf(Api),
	fitToIDeviceScreen: PropTypes.func,
	isMobile: PropTypes.bool,
	onDeviceNeedsSubscribing: PropTypes.func,
	onSentSuccessfully: PropTypes.func,
	replyTextRef: PropTypes.object,
	restartPolling: PropTypes.func,
};

export default React.forwardRef((props, ref) => <ReplyActions replyTextRef={ref} {...props} />);
