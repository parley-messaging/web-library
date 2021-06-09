import React, {Component} from "react";
import Configuration from "./Configuration";
import Messaging from "./Messaging";
import EventLog from "./EventLog";

class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			deviceIdentification: "",
			accountIdentification: "0W4qcE5aXoKq9OzvHxj2",
			apiDomain: "https://api.parley.nu",
		};

		this.handleOnConfigurationChange = this.handleOnConfigurationChange.bind(this);
	}

	render() {
		return (
			<>
				<Configuration
					accountIdentification={this.state.accountIdentification}
					apiDomain={this.state.apiDomain}
					deviceIdentification={this.state.deviceIdentification}
					onChange={this.handleOnConfigurationChange}
				/>
				<Messaging
					accountIdentification={this.state.accountIdentification}
					apiDomain={this.state.apiDomain}
					deviceIdentification={this.state.deviceIdentification}
				/>
				<EventLog
					apiDomain={this.state.apiDomain}
				/>
			</>
		);
	}

	handleOnConfigurationChange(domID, domValue) {
		this.setState({[domID]: domValue});
	}
}

export default App;
