import React, {Component} from "react";
import {apiSingleton} from "./Api";

class EventLog extends Component {
	constructor(props) {
		super(props);

		this.state = {events: []};

		// API Event handlers
		this.handleOnEvent = this.handleOnEvent.bind(this);

		this.api = apiSingleton();
	}

	componentDidMount() {
		// Register event listeners for API events
		this.api.addEventListener(this.api.events.onSubscribe, this.handleOnEvent);
		this.api.addEventListener(this.api.events.onSendMessage, this.handleOnEvent);
		this.api.addEventListener(this.api.events.onGetMessages, this.handleOnEvent);
	}

	componentWillUnmount() {
		// Un-register event listeners for API events
		this.api.removeEventListener(this.api.events.onSubscribe, this.handleOnEvent);
		this.api.removeEventListener(this.api.events.onSendMessage, this.handleOnEvent);
		this.api.removeEventListener(this.api.events.onGetMessages, this.handleOnEvent);
	}

	render() {
		const header = "Event Log";
		return (
			<div>
				<h2>{header}</h2>
				{this.state.events.map(event => (
					<div key={event}>
						{this.formatEventString(event)}
					</div>
				))}
			</div>
		);
	}

	formatEventString(event) {
		return `Event: ${event.type} has triggered`;
	}

	handleOnEvent(event) {
		console.log(event);
		this.setState(prevState => ({
			events: [
				...prevState.events,
				event,
			],
		}));
	}

	convertTimestampToDate(timestamp) {
		const unixTimestampMultiplier = 1000; // Converts unix timestamp from seconds to milliseconds
		const date = new Date(timestamp * unixTimestampMultiplier);
		return `[${date.getFullYear()}/${date.getMonth()}/${date.getDay()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`;
	}
}

export default EventLog;
