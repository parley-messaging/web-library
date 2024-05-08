import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./ReplyActions.module.css";
import ReplyText from "./ReplyText";
import MobileSubmit from "./Buttons/MobileSubmit";
import Api from "../Api/Api";
import {InterfaceTextsContext} from "./Scripts/Context";
import ApiEventTarget from "../Api/ApiEventTarget";
import {subscribe} from "../Api/Constants/Events";

class ReplyActions extends Component {
	constructor(props) {
		super(props);

		this.state = {reply: ""};
	}

	setReplyValue = (newReply, callback) => {
		this.setState({reply: newReply}, callback);
	}

	handleChange = (event) => {
		this.setState(() => ({reply: event.target.value}));
	}

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
			ApiEventTarget.addEventListener(subscribe, this.handleSubscribe);

			this.props.onDeviceNeedsSubscribing();
		}
	}

	handleSubscribe = (event) => {
		if(!event.detail.errorNotifications)
			this.sendMessage();

		// This is a one time thing (for this submit),
		// so stop listening for future subscriptions
		ApiEventTarget.removeEventListener(subscribe, this.handleSubscribe);
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
									&& <MobileSubmit onClick={this.handleSubmit} />
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

export default ReplyActions;
