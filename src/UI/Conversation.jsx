import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Conversation.module.css";
import MessageTypes from "../Api/Constants/MessageTypes";
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
		this.conversationBottom = React.createRef();

		// state
		this.state = {
			welcomeMessage: this.props.welcomeMessage,
			messages: [],
			stickyMessage: "",
		};
	}

	componentDidMount() {
		ApiEventTarget.addEventListener(messagesEvent, this.handleMessages);

		// Get the new messages
		this.props.restartPolling();
	}

	componentWillUnmount() {
		ApiEventTarget.removeEventListener(messagesEvent, this.handleMessages);
	}

	// eslint-disable-next-line no-unused-vars
	componentDidUpdate(prevProps, prevState, snapshot) {
		// Scroll to bottom if there are new messages in the messages state
		if(this.state.messages.length > 0 && prevState.messages.length > 0) {
			const currentStateLastMessage = this.state.messages[this.state.messages.length - 1];
			const prevStateLastMessage = prevState.messages[prevState.messages.length - 1];

			// We have to compare ids here because the API has a limit on how many messages it returns
			// So eventually the lengths would always be equal..
			if(currentStateLastMessage.id !== prevStateLastMessage.id)
				this.conversationBottom.current.scrollIntoView();
		} else if(this.state.messages.length > 0 && prevState.messages.length === 0) {
			// We also want to scroll down when we start receiving the messages
			// for the first time
			this.conversationBottom.current.scrollIntoView();
		}
	}

	handleMessages = (eventData) => {
		this.setState(() => ({
			welcomeMessage: eventData.detail.welcomeMessage,
			messages: eventData.detail.data,
			stickyMessage: eventData.detail.stickyMessage,
		}));
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

	shouldRenderAgentName = (currentMessageId, previousMessageId) => {
		if(this.state.messages[currentMessageId].typeId !== MessageTypes.Agent)
			return false;

		if(this.state.messages[previousMessageId]
			&& this.state.messages[previousMessageId].typeId === MessageTypes.Agent)
			return false;

		return true;
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
		// Sort messages before they get into the state
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
										&& <Message
											message={message}
											showAgent={this.shouldRenderAgentName(index, index - 1)}
										   />
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
					<div ref={this.conversationBottom} />
				</div>
			</div>
		);
	}
}

Conversation.propTypes = {
	restartPolling: PropTypes.func,
	welcomeMessage: PropTypes.string,
};

export default Conversation;
