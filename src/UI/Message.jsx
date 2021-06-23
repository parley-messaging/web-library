import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Message.module.css";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import MessageTypes from "../Api/Constants/MessageTypes";

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
		let classNames = styles.messageBubble;
		if(this.props.message.typeId === MessageTypes.User)
			classNames += ` ${styles.user}`;
		else if(this.props.message.typeId === MessageTypes.Agent)
			classNames += ` ${styles.agent}`;
		else
			return null;


		// TODO: Markdown opties, alleen link ondersteunen

		return (
			<div className={classNames}>
				{
					this.props.message.agent
					&& this.props.message.agent.name.length > 0
						&& <div className={styles.name}>
							{this.props.message.agent.name}
						   </div>
				}
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
		agent: PropTypes.shape({
			avatar: PropTypes.string,
			id: PropTypes.number,
			name: PropTypes.string.isRequired,
		}),
		id: PropTypes.number,
		media: PropTypes.shape({
			description: PropTypes.string,
			id: PropTypes.string.isRequired,
		}),
		message: PropTypes.string,
		quickReplies: PropTypes.arrayOf(PropTypes.string),
		time: PropTypes.number.isRequired,
		typeId: PropTypes.number.isRequired,
	}),
};

export default Message;
