import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Conversation.module.css";
import MessageTypes from "../Api/Constants/MessageTypes";

// components
import DateGroup from "./DateGroup";
import Message from "./Message";
import QuickReplies from "./QuickReplies";
import Announcement from "./Announcement";

class Conversation extends Component {
	constructor(props) {
		super(props);

		this.renderedDates = [];

		// state
		this.state = {
			messages: [],
			stickyMessage: "",
		};
	}

	componentDidMount() {
		this.getMessages();
		this.getStickyMessage();
	}

	getStickyMessage = () => {
		const message = "Sorry we are closed right now. We will be open next day from 09:00 - 17:55";

		this.setState(() => ({stickyMessage: message}));
	};

	getMessages = () => {
		const messageArray = [
			{
				id: 159299,
				time: 1623060000,
				message: null,
				image: null,
				typeId: 2,
				agent: {
					id: 1,
					name: "Tracebuzz",
					avatar: "https://beta.tracebuzz.com/V002/img/avatar.php?i=TB&c=f4931d",
				},
				carousel: null,
				quickReplies: [
					"yes", "no", "maybe",
				],
				custom: null,
				title: null,
				media: null,
				buttons: null,
			},
			{
				id: 159297,
				time: 1623060000,
				message: "some_system_message",
				image: null,
				typeId: 3,
				agent: {
					id: 1,
					name: "Tracebuzz",
					avatar: "https://beta.tracebuzz.com/V002/img/avatar.php?i=TB&c=f4931d",
				},
				carousel: null,
				quickReplies: null,
				custom: null,
				title: null,
				media: null,
				buttons: null,
			},
			{
				id: 159296,
				time: 1623060000,
				message: "www.google.nl",
				image: null,
				typeId: 2,
				agent: {
					id: 1,
					name: "Tracebuzz",
					avatar: "https://beta.tracebuzz.com/V002/img/avatar.php?i=TB&c=f4931d",
				},
				carousel: null,
				quickReplies: null,
				custom: null,
				title: null,
				media: null,
				buttons: null,
			},
			{
				id: 159293,
				time: 1622800800,
				message: "😷🤧",
				image: null,
				typeId: 1,
				agent: null,
				carousel: [],
				quickReplies: [],
				custom: [],
				title: null,
				media: null,
				buttons: [],
			},
			{
				id: 159290,
				time: 1622797200,
				message: "Test message #4, this one has an emoji 🤧",
				image: null,
				typeId: 2,
				agent: {
					id: 1,
					name: "Tracebuzz",
					avatar: "https://beta.tracebuzz.com/V002/img/avatar.php?i=TB&c=f4931d",
				},
				carousel: null,
				quickReplies: null,
				custom: null,
				title: null,
				media: null,
				buttons: null,
			},
			{
				id: 159287,
				time: 1622631600,
				message: "Test message #3",
				image: null,
				typeId: 1,
				agent: null,
				carousel: [],
				quickReplies: [],
				custom: [],
				title: null,
				media: null,
				buttons: [],
			},
			{
				id: 159284,
				time: 1622628000,
				message: "Test message #2, this one has a markdown [link](https://google.com)",
				image: null,
				typeId: 2,
				agent: {
					id: 1,
					name: "Tracebuzz",
					avatar: "https://beta.tracebuzz.com/V002/img/avatar.php?i=TB&c=f4931d",
				},
				carousel: null,
				quickReplies: null,
				custom: null,
				title: null,
				media: null,
				buttons: null,
			},
			{
				id: 159281,
				time: 1622545200,
				message: "Test message #1",
				image: null,
				typeId: 1,
				agent: null,
				carousel: [],
				quickReplies: [],
				custom: [],
				title: null,
				media: null,
				buttons: [],
			},
		];

		this.setState(() => ({messages: messageArray.reverse()}));
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
						this.props.welcomeMessage
							&& <Announcement message={this.props.welcomeMessage} />
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
