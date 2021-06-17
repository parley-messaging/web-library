// This component shows a basic way of implementing the Api
// It shows how to initialize it and how you can listen for events

import React, {Component} from "react";
import Api from "./Api/Api";
import ApiEventTarget from "./Api/ApiEventTarget";
import {messages, messageSend, subscribe} from "./Api/Constants/Events";

class EventLog extends Component {
	constructor(props) {
		super(props);
		this.state = {events: []};

		// Step 1: Initialize the Api
		// We are not making any api calls so we dont need any valid identifications
		this.Api = new Api(
			"https://api.parley.nu",
			"someAccountIdentification",
			"someDeviceIdentification",
			ApiEventTarget,
		);
	}

	componentDidMount() {
		// Step 2: Register event listeners for API events
		ApiEventTarget.addEventListener(subscribe, this.handleEvent);
		ApiEventTarget.addEventListener(messageSend, this.handleEvent);
		ApiEventTarget.addEventListener(messages, this.handleEvent);
	}

	componentWillUnmount() {
		// Step 3: Un-register event listeners for API events
		ApiEventTarget.removeEventListener(subscribe, this.handleEvent);
		ApiEventTarget.removeEventListener(messageSend, this.handleEvent);
		ApiEventTarget.removeEventListener(messages, this.handleEvent);
	}

	render() {
		const header = "Event Log";
		return (
			<div>
				<h2>{header}</h2>
				{[...this.state.events].reverse().map(event => (
					<div key={event.timeStamp}>
						{this.formatEventString(event)}
					</div>
				))}
			</div>
		);
	}

	handleEvent = (event) => {
		// Step 4: Do something when an event is triggered, in this case save it to the list
		this.setState(prevState => ({
			events: [
				...prevState.events,
				event,
			],
		}));
	}

	formatEventString(event) {
		// eslint-disable-next-line compat/compat
		const time = this.convertTimestampToDate(performance.timeOrigin + event.timeStamp);
		return `${time} Event: ${event.type} has triggered`;
	}

	convertTimestampToDate(timestamp) {
		const date = new Date(timestamp);
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

export default EventLog;
