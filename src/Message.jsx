import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Message.module.css";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";

// components
import Image from "./Image";

class Message extends Component {
	showTime = (timestamp) => {
		const toSecondsMultiplier = 1000;
		return new Date(timestamp * toSecondsMultiplier).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
	}

	render() {
		const typeIdUser = 1; // 1 user, 2 agent
		const classNames = `${styles.container} ${this.props.message.typeId === typeIdUser ? styles.user : styles.agent}`;

		// TODO: Markdown opties, alleen link ondersteunen [nog geen oplossing gevonden]

		return (
			<div className={classNames}>
				{this.props.message.agent &&
					<div className={styles.name}>
						{this.props.message.agent.name}
					</div>}
				<div className={styles.message}>
					{this.props.message.media ?
						<Image media={this.props.message.media} /> :
						<ReactMarkdown remarkPlugins={[gfm]} skipHtml={true}>
							{this.props.message.message}
						</ReactMarkdown>}
					<span className={styles.time}>
						{this.showTime(this.props.message.time)}
					</span>
				</div>
			</div>
		);
	}
}

Message.propTypes = {
	message: PropTypes.shape({
		id: PropTypes.number.isRequired,
		message: PropTypes.string,
		time: PropTypes.number.isRequired,
		typeId: PropTypes.number.isRequired,
		agent: PropTypes.shape({
			avatar: PropTypes.string.isRequired,
			id: PropTypes.number.isRequired,
			name: PropTypes.string.isRequired,
		}),
		quickReplies: PropTypes.arrayOf(PropTypes.string),
		media: PropTypes.shape({
			id: PropTypes.string.isRequired,
			description: PropTypes.string,
		}),

		// status: PropTypes.number.isRequired, // TODO: What is status?
	}),
};

export default Message;
