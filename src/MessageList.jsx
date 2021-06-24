import React, {Component} from "react";
import PropTypes from "prop-types";

class MessageList extends Component {
	render() {
		const header = "Message Log";
		return (
			<div>
				<h2>{header}</h2>
				{this.props.messages.map(message => (
					<div key={message.id}>
						{this.convertTimestampToDate(message.time)} {message.message}
					</div>
				))}
			</div>
		);
	}

	convertTimestampToDate(timestamp) {
		const unixTimestampMultiplier = 1000; // Converts unix timestamp from seconds to milliseconds
		const date = new Date(timestamp * unixTimestampMultiplier);
		const format = new Intl.DateTimeFormat("nl", {
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
		}).format(date);

		return `[${format}]`;
	}
}

MessageList.propTypes = {messages: PropTypes.array};

export default MessageList;
