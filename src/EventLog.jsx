// This component shows a basic way of implementing the ApiEventTarget
// It shows how to initialize it and how you can listen for events

import React, {Component} from "react";
import {apiEventTargetSingleton} from "./Api";
import {Events} from "./Api/Constants";

class EventLog extends Component {
	constructor(props) {
		super(props);
		this.state = {events: []};

		// Step 1: Initialize the ApiEventTarget
		this.ApiEventTarget = apiEventTargetSingleton();

		this.handleEvent = this.handleEvent.bind(this);
	}

	componentDidMount() {
		// Step 2: Register event listeners for API events
		this.ApiEventTarget.addEventListener(Events.onSubscribe, this.handleEvent);
		this.ApiEventTarget.addEventListener(Events.onSendMessage, this.handleEvent);
		this.ApiEventTarget.addEventListener(Events.onGetMessages, this.handleEvent);
	}

	componentWillUnmount() {
		// Step 3: Un-register event listeners for API events
		this.ApiEventTarget.removeEventListener(Events.onSubscribe, this.handleEvent);
		this.ApiEventTarget.removeEventListener(Events.onSendMessage, this.handleEvent);
		this.ApiEventTarget.removeEventListener(Events.onGetMessages, this.handleEvent);
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

	handleEvent(event) {
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
		return `[${date.getFullYear()}/${date.getMonth()}/${date.getDay()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`;
	}
}

export default EventLog;
