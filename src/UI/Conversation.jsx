import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Conversation.module.css";
import MessageTypes from "../Api/Constants/MessageTypes";
import DateGroup from "./DateGroup";
import QuickReplies from "./QuickReplies";
import Announcement from "./Announcement";
import ApiEventTarget from "../Api/ApiEventTarget";
import {messages as messagesEvent} from "../Api/Constants/Events";
import Logger from "js-logger";
import Api from "../Api/Api";
import Message from "./Message";
import Carousel from "./Carousel";
import {STATUS_SEEN} from "../Api/Constants/Statuses";
import {announce, clearAnnouncer} from "@react-aria/live-announcer";

class Conversation extends Component {
	constructor(props) {
		super(props);

		this.renderedDates = [];
		this.conversationBottom = React.createRef();
		this.bodyRef = React.createRef();
		this.clientHasScrolledManually = false;
		this.scrollDownOnShow = false;
		this.isFetchingOlderMessages = false;
		this.hasOlderMessages = true;
		this.hasNewUnreadMessages = false;
		this.welcomeMessageAnnouncementRendered = false;

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
		Logger.debug("Restarting polling because Conversation has mounted");
		this.props.restartPolling();
	}

	componentWillUnmount() {
		ApiEventTarget.removeEventListener(messagesEvent, this.handleMessages);
	}

	// eslint-disable-next-line no-unused-vars
	componentDidUpdate(prevProps, prevState, snapshot) {
		// Scroll to bottom if there are new messages in the messages state
		// and client has not scrolled manually already
		if(!this.clientHasScrolledManually) {
			if(this.scrollDownOnShow) {
				// There was a request to scroll to bottom but the conversation was hidden
				// so now we execute it since the chat is visible again.
				Logger.debug("Executing scroll to bottom, which was requested when Conversation was hidden but it is visible now");
				this.scrollToBottom();
			} else if(this.state.messages.length > 0 && prevState.messages.length > 0) {
				const currentStateLastMessage = this.state.messages[this.state.messages.length - 1];
				const prevStateLastMessage = prevState.messages[prevState.messages.length - 1];

				// We have to compare ids here because the API has a limit on how many messages it returns
				// So eventually the lengths would always be equal...
				if(currentStateLastMessage.id !== prevStateLastMessage.id) {
					Logger.debug("Scroll to bottom, because latest message has a different id than the previous latest message");
					this.scrollToBottom();
				}
			} else if(this.state.messages.length > 0 && prevState.messages.length === 0) {
				// We also want to scroll down when we start receiving the messages
				// for the first time
				Logger.debug("Scroll to bottom, because we got messages when previously we didn't have any");
				this.scrollToBottom();
			}
		}

		// Check for changes in messages status
		if(
			this.state.messages.filter(message => message.status < STATUS_SEEN).length
			> prevState.messages.filter(message => message.status < STATUS_SEEN).length
		) {
			// We cannot mark the messages as seen yet here, because this can trigger if
			// the chat is not yet visible. So we should keep track of if we have found
			// new unread messages and later, once the chat is shown, we can mark them as seen.
			this.hasNewUnreadMessages = true;
		}

		// Check for changes in visibility
		if(this.props.isChatShown && this.hasNewUnreadMessages) {
			Logger.debug("Updating messages status because there are unseen messages that now have been rendered");

			// If the current state has more seen messages
			// compared to the previous state,
			// we should mark them locally as seen.
			// We can assume they have been rendered because of the isChatShown property.
			// Apparently this component renders even when not shown, so it is important
			// we only do this if isChatShown is true, otherwise the message would be marked
			// as seen while the client can't "see" them yet because the chat is not shown.
			this.markMessagesAsSeen(this.state.messages
				.filter(message => message.status < STATUS_SEEN)
				.map(message => message.id));

			this.hasNewUnreadMessages = false;
		}
	}

	scrollToBottom = () => {
		if(this.props.isChatShown) {
			this.conversationBottom.current.scrollIntoView();
			this.scrollDownOnShow = false;
		} else {
			// Remember this for when chat is shown and then scroll down
			Logger.debug("Scroll to bottom requested, but the Conversation is hidden. Executing this request when Conversation is visible");
			this.scrollDownOnShow = true;
		}
	};

	handleMessages = (eventData) => {
		const newState = {};

		/** @var {[]} messages */
		const messages = eventData.detail.data;

		if(eventData.detail.errorNotifications?.filter(x => x === "api_key_not_valid" || x === "device_not_registered")) {
			Logger.debug("Clearing message because the API doesn't allow this device access to the messages");
			newState.messages = [];
		} else if(messages.length > 0) {
			// Compare the received messages with our state messages
			// If there is a change, add them to the new state
			// If there is no change we don't want to add them
			// to prevent an unnecessary render.
			const sortedMessages = Conversation.sortMessagesByID(messages);
			if(JSON.stringify(sortedMessages) !== JSON.stringify(this.state.messages)) {
				// Important that we make a clone of the state, otherwise we are updating the state directly
				newState.messages = JSON.parse(JSON.stringify(this.state.messages));

				// Add NEW messages to the newState
				messages.forEach((message) => {
					if(this.state.messages.some(x => x.id === message.id))
						return; // Ignore messages we already have in our state

					newState.messages.push(message);

					// Announce new agent message but only if this is not the first time we get all messages.
					// We only want to announce new messages after the "initial load"
					if(this.state.messages.length > 0 && message.typeId === MessageTypes.Agent)
						this.announceMessageForScreenReaders(message);
				});

				// Sort messages again after pushing to the array
				// so that any old messages are at the front
				newState.messages = Conversation.sortMessagesByID(newState.messages);
			}
		}


		// Set welcome message if we got one from the api
		// otherwise use the default set by props
		const welcomeMessage = eventData.detail.welcomeMessage || this.props.defaultWelcomeMessage;
		if(welcomeMessage !== this.state.welcomeMessage)
			newState.welcomeMessage = welcomeMessage;


		const {stickyMessage} = eventData.detail;
		if(stickyMessage !== this.state.stickyMessage)
			newState.stickyMessage = stickyMessage;


		// If there is nothing in the new state
		// we don't have to call setState and trigger an update
		if(Object.keys(newState).length === 0)
			return;


		this.setState(currentState => ({
			...currentState,
			...newState,
		}));
	};

	setRenderedDate = (date) => {
		if(this.renderedDates.includes(date))
			return false;


		this.renderedDates.push(date);

		return true;
	};

	getDateFromTimestamp = (timestamp) => {
		const toMillisecondsMultiplier = 1000;
		return new Date(timestamp * toMillisecondsMultiplier).toLocaleDateString();
	};

	shouldRenderAgentName = (currentMessageId, previousMessageId) => {
		const currentMessage = this.state.messages[currentMessageId];
		if(currentMessage.typeId !== MessageTypes.Agent)
			return false;

		const previousMessage = this.state.messages[previousMessageId];
		if(previousMessage?.typeId === MessageTypes.Agent) {
			if(currentMessage?.agent?.name !== previousMessage?.agent?.name)
				return true;

			return false;
		}

		return true;
	};

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

	handleScroll = () => {
		if(!this.bodyRef.current)
			return;


		const scrollTopMax = this.bodyRef.current.scrollHeight - this.bodyRef.current.clientHeight;
		const scrollCurrent = this.bodyRef.current.scrollTop;

		this.handleScrollCloseToBottom(scrollCurrent, scrollTopMax);
		this.handleScrollCloseToTop(scrollCurrent);
	};

	handleScrollCloseToBottom = (scrollCurrent, scrollTopMax) => {
		const scrollTopMargin = 100; // Roughly the size of 1,5 message bubble + margin

		// noinspection RedundantIfStatementJS
		if(scrollCurrent >= scrollTopMax - scrollTopMargin) {
			// Client probably scrolled back down so we should reset the flag so we can scroll to new messages again
			this.clientHasScrolledManually = false;
		} else {
			this.clientHasScrolledManually = true;
		}
	};

	handleScrollCloseToTop = (scrollCurrent) => {
		const scrollTopMargin = 500; // Roughly the size of 5 * 1,5 message bubble + margin

		// Fetch older messages when scrolling to close to the top
		if(this.hasOlderMessages
			&& !this.isFetchingOlderMessages
			&& scrollCurrent <= scrollTopMargin
		) {
			this.isFetchingOlderMessages = true;
			this.props.api.getMessages(this.state.messages[0].id, "before")
				.then((data) => {
					if(data.data.length === 0)
						this.hasOlderMessages = false;
				})
				.finally(() => {
					this.isFetchingOlderMessages = false;
				});
		}
	};

	markMessagesAsSeen = (messageIds) => {
		if(messageIds.length === 0)
			return;

		Logger.debug(`Marking the following messages as seen, because they have been rendered: ${messageIds.join(",")}`);

		// Mark them seen locally first, so subsequent renders would not cause this method to update them again
		this.setState((prevState) => {
			const stateMessages = prevState.messages;
			messageIds.forEach((id) => {
				const stateMessageIndex = stateMessages.findIndex(x => x.id === id);
				if(stateMessageIndex > -1)
					stateMessages[stateMessageIndex].status = STATUS_SEEN;
			});
			return {messages: stateMessages};
		});

		// Mark them externally as seen
		this.props.api.updateMessagesStatus(STATUS_SEEN, messageIds);
	};

	shouldRenderWelcomeMessageUnderDate = (message) => {
		const msInSecond = 1000;
		const isMessageTimeToday
			= this.getDateFromTimestamp(message.time) === this.getDateFromTimestamp(Date.now() / msInSecond);
		const isDateRendered = this.renderedDates.includes(this.getDateFromTimestamp(message.time));

		return isMessageTimeToday && isDateRendered;
	}

	renderWelcomeMessageAnnouncement = () => {
		if(!this.state.welcomeMessage)
			return null;
		if(this.welcomeMessageAnnouncementRendered)
			return null;

		this.welcomeMessageAnnouncementRendered = true;
		return <Announcement message={this.state.welcomeMessage} />;
	}

	announceMessageForScreenReaders = (message) => {
		const agentName = message.agent?.name || "agent"; // TODO: Translate

		clearAnnouncer("assertive");
		announce(`${agentName} says: ${message.message}`, "assertive");
	}

	render() {
		this.renderedDates = []; // Reset the rendered dates
		const bodyRole = "feed"; // Used to keep jsx-a11y/no-static-element-interactions happy, not sure if this is the best fitting role...
		this.welcomeMessageAnnouncementRendered = false;

		return (
			<div className={styles.wrapper}>
				<div
					className={styles.body}
					onScroll={this.handleScroll}
					ref={this.bodyRef}
					role={bodyRole}
					tabIndex={-1} // tabIndex is required for onKeyDown to work
				>
					{
						this.state.messages.map((message, index, array) => (
							<React.Fragment key={message.id}>
								{
									this.setRenderedDate(this.getDateFromTimestamp(message.time))
									&& <DateGroup timestamp={message.time} />
								}
								{
									this.shouldRenderWelcomeMessageUnderDate(message)
									&& this.renderWelcomeMessageAnnouncement()
								}
								{
									message.carousel.length === 0
									&& <Message
										api={this.props.api}
										message={message}
										showAgent={this.shouldRenderAgentName(index, index - 1)}
									   />
								}
								{
									message.carousel.length > 0
									&& <Carousel
										items={
											message.carousel.map((carouselItem, _index) => (
												<Message
													api={this.props.api}
													/* eslint-disable-next-line react/no-array-index-key --
													   There is nothing unique we can use inside the carouselItem */
													key={_index}
													message={
													{
														...message,
														...carouselItem,
													}
													}
													showAgent={false}
												/>
											))
										}
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
					{this.renderWelcomeMessageAnnouncement()}
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
	isChatShown: PropTypes.bool,
	restartPolling: PropTypes.func,
};

export default Conversation;
