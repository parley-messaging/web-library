import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Chat.module.css";

// components
import Header from "./Header";
import Conversation from "./Conversation";
import ReplyActions from "./ReplyActions";

class Chat extends Component {
	render() {
		const allowEmoji = false;
		const allowFileUpload = false;

		return (
			<div className={styles.chat}>
				<Header
					closeAction={this.props.closeAction}
					menuAction={this.props.menuAction}
					minimizeAction={this.props.minimizeAction}
					title={this.props.title}
				/>
				<Conversation welcomeMessage={this.props.welcomeMessage} />
				<ReplyActions allowEmoji={allowEmoji} allowFileUpload={allowFileUpload} />
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