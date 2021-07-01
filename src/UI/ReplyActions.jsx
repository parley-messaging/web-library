import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./ReplyActions.module.css";
import ReplyText from "./ReplyText";
import MobileSubmit from "./Buttons/MobileSubmit";
import Api from "../Api/Api";

class ReplyActions extends Component {
	constructor(props) {
		super(props);

		this.state = {reply: ""};
	}

	handleChange = (event) => {
		this.setState(() => ({reply: event.target.value}));
	}

	handleSubmit = () => {
		// While sending the message we don't want the user to keep
		// trying to send this message by submitting the input field,
		// so we disable it until we get a response from the API
		this.props.replyTextRef.current.textArea.current.disabled = true;

		// Send reply to Parley
		this.props.api.sendMessage(this.state.reply)
			.then(() => {
				// Reset state
				this.setState(() => ({reply: ""}));
				this.props.replyTextRef.current.textArea.current.disabled = false;
			});
	}

	render() {
		return (
			<div className={styles.footer}>
				<ReplyText
					fitToIDeviceScreen={this.props.fitToIDeviceScreen}
					isMobile={this.props.isMobile}
					onChange={this.handleChange}
					onSubmit={this.handleSubmit}
					ref={this.props.replyTextRef}
					value={this.state.reply}
				/>
				<div className={styles.actions}>
					{
						this.props.isMobile && this.state.reply !== ""
						&& <MobileSubmit onClick={this.handleSubmit} />
					}
				</div>
			</div>
		);
	}
}

ReplyActions.propTypes = {
	allowEmoji: PropTypes.bool,
	allowFileUpload: PropTypes.bool,
	api: PropTypes.instanceOf(Api),
	fitToIDeviceScreen: PropTypes.func,
	isMobile: PropTypes.bool,
	replyTextRef: PropTypes.object,
};

export default React.forwardRef((props, ref) => <ReplyActions replyTextRef={ref} {...props} />);
