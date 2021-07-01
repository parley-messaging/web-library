import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Conversation.module.css";
import MessageTypes from "../Api/Constants/MessageTypes";

// components
import DateGroup from "./DateGroup";
import Message from "./Message";
import QuickReplies from "./QuickReplies";
import Announcement from "./Announcement";
import ApiEventTarget from "../Api/ApiEventTarget";
import {messages as messagesEvent} from "../Api/Constants/Events";

class Conversation extends Component {
	constructor(props) {
		super(props);

		this.renderedDates = [];

		// state
		this.state = {
			welcomeMessage: "",
			messages: [],
			stickyMessage: "",
		};
	}

	componentDidMount() {
		// Default the welcome message to the one in the props
		this.setState(() => ({welcomeMessage: this.props.welcomeMessage}));

		ApiEventTarget.addEventListener(messagesEvent, this.handleMessages);
	}

	componentWillUnmount() {
		ApiEventTarget.removeEventListener(messagesEvent, this.handleMessages);
	}

	handleMessages = (eventData) => {
		this.setState(() => ({welcomeMessage: eventData.detail.welcomeMessage}));

		this.setState(() => ({messages: eventData.detail.data}));

		this.setState(() => ({stickyMessage: eventData.detail.stickyMessage}));
	}

	setRenderedDate = (date) => {
		if(this.renderedDates.includes(date))
			return false;

		this.renderedDates.push(date);

		return true;
	}

	getDateFromTimestamp = (timestamp) => {
		const toMillisecondsMultiplier = 1000;
		return new Date(timestamp * toMillisecondsMultiplier).toLocaleDateString();
	}

	static sortMessagesByID(messages) {
		return messages.sort((left, right) => {
			if(left.id < right.id)
				return -1;
			else if(left.id > right.id)
				return 1;

			return 0;
		});
	}

	static getDerivedStateFromProps(props, state) {
		return {
			...state,
			messages: Conversation.sortMessagesByID(state.messages),
		};
	}

	render() {
		this.renderedDates = []; // Reset the rendered dates

		return (
			<div className={styles.wrapper}>
				<div className={styles.body}>
					{
						this.state.welcomeMessage
							&& <Announcement message={this.state.welcomeMessage} />
					}
					{
						this.state.messages.map((message, index, array) => (
							<React.Fragment key={message.id}>
								{
									this.setRenderedDate(this.getDateFromTimestamp(message.time))
										&& <DateGroup timestamp={message.time} />
								}
								{
									message.message !== null
									&& message.message.length > 0
										&& <Message message={message} />
								}
								{
									message.typeId === MessageTypes.Agent
									&& index === array.length - 1
									&& message.quickReplies
									&& message.quickReplies.length > 0
										&& <QuickReplies />
								}
							</React.Fragment>
						))
					}
					{
						this.state.stickyMessage
							&& <Announcement message={this.state.stickyMessage} />
					}
				</div>
				{/* <div className={styles.error}>*/}
				{/* </div>*/}
			</div>
		);
	}
}

Conversation.propTypes = {welcomeMessage: PropTypes.string};

export default Conversation;
