import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Conversation.module.css";

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
		const message = "Sorry we are closed right know. We will be open next day from 09:00 - 17:55";

		// eslint-disable-next-line no-invalid-this
		this.setState(() => ({stickyMessage: message}));
	};

	getMessages = () => {
		const messageArray = [
			{
				id: 159296,
				time: 1620309874,
				message: ":apple:",
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
				time: 1620309867,
				message: ":lollipop:",
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
				time: 1620309858,
				message: "Test message #4, this one has an emoji :+1:",
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
				time: 1620309834,
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
				time: 1620309772,
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
				time: 1620309744,
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

		// eslint-disable-next-line no-invalid-this
		this.renderedDates = [];
		// eslint-disable-next-line no-invalid-this
		this.setState(() => ({messages: messageArray.reverse()}));
	}

	setRenderedDate = (date) => {
		// eslint-disable-next-line no-invalid-this
		if(this.renderedDates.includes(date))
			return false;

		// eslint-disable-next-line no-invalid-this
		this.renderedDates.push(date);

		return true;
	}

	getDateFromTimestamp = (timestamp) => {
		const toSecondsMultiplier = 1000;
		return new Date(timestamp * toSecondsMultiplier).toLocaleDateString();
	}

	render() {
		const messageTypeAgent = 2;

		return (
			<div className={styles.wrapper}>
				<div className={styles.body}>
					{this.props.welcomeMessage &&
						<div className={styles.welcome}>
							<Announcement message={this.props.welcomeMessage} />
						</div>}
					{this.state.messages.map(message => (
						<React.Fragment key={message.id}>
							{this.setRenderedDate(this.getDateFromTimestamp(message.time)) &&
								<DateGroup timestamp={message.time} />}
							<Message message={message} />
							{message.typeId === messageTypeAgent &&
							message.quickReplies && message.quickReplies.length &&
								<QuickReplies />}
						</React.Fragment>
					))}
					{this.state.stickyMessage &&
						<div className={styles.sticky}>
							<Announcement message={this.state.stickyMessage} />
						</div>}
				</div>
				<div className={styles.error}>

				</div>
			</div>
		);
	}
}

Conversation.propTypes = {welcomeMessage: PropTypes.string};

export default Conversation;
