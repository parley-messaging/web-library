import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Conversation.module.css";
import MessageTypes from "../Api/Constants/MessageTypes";
import DateGroup from "./DateGroup";
import Message from "./Message";
import QuickReplies from "./QuickReplies";
import Announcement from "./Announcement";
import ApiEventTarget from "../Api/ApiEventTarget";
import {messages as messagesEvent} from "../Api/Constants/Events";
import Logger from "js-logger";
import Api from "../Api/Api";

class Conversation extends Component {
	constructor(props) {
		super(props);

		this.renderedDates = [];
		this.conversationBottom = React.createRef();

		// state
		this.state = {
			welcomeMessage: "",
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
		let messages = eventData.detail.data;
		if(eventData.detail.errorNotifications?.filter(x => x === "api_key_not_valid" || x === "device_not_registered")) {
			Logger.debug("Clearing message because the API doesn't allow this device access to the messages");
			messages = [];
		}

		const newState = {
			messages,
			stickyMessage: eventData.detail.stickyMessage,
		};

		// Set welcome message if we got one from the api
		// otherwise use the default set by props
		if(eventData.detail.welcomeMessage)
			newState.welcomeMessage = eventData.detail.welcomeMessage;
		else
			newState.welcomeMessage = this.props.defaultWelcomeMessage;

		this.setState(() => newState);
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
								<Message
									api={this.props.api}
									message={message}
									showAgent={this.shouldRenderAgentName(index, index - 1)}
								/>
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
	api: PropTypes.instanceOf(Api),
	defaultWelcomeMessage: PropTypes.string,
	restartPolling: PropTypes.func,
};

export default Conversation;
