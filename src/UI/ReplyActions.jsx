import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./ReplyActions.module.css";
import ReplyText from "./ReplyText";
import MobileSubmit from "./Buttons/MobileSubmit";

// import ReplyAttachment from "./ReplyAttachment";
// import EmojiLauncher from "./EmojiLauncher";
// import EmojiPicker from "./EmojiPicker";

class ReplyActions extends Component {
	constructor(props) {
		super(props);

		// state
		this.state = {reply: ""};
	}

	handleChange = (event) => {
		this.setState(() => ({reply: event.target.value}));
	}

	handleSubmit = () => {
		// TODO: Send message, for now console log state
		console.log(this.state.reply);

		this.setState(() => ({reply: ""}));
	}

	render() {
		return (
			<div className={styles.footer}>
				<ReplyText
					fitToIDeviceScreen={this.props.fitToIDeviceScreen}
					isMobile={this.props.isMobile}
					onChange={this.handleChange}
					onSubmit={this.handleSubmit}
					value={this.state.reply}
				/>
				<div className={styles.actions}>
					{this.props.isMobile && this.state.reply !== "" &&
						<MobileSubmit onClick={this.handleSubmit} />}
				</div>
			</div>
		);
	}
}

ReplyActions.propTypes = {
	allowEmoji: PropTypes.bool,
	allowFileUpload: PropTypes.bool,
	fitToIDeviceScreen: PropTypes.func,
	isMobile: PropTypes.bool,
};

export default ReplyActions;
