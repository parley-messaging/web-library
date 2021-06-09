import React, {Component} from "react";
import Configuration from "./Configuration";
import Messaging from "./Messaging";
import EventLog from "./EventLog";
import {DeviceTypes, PushTypes} from "./Api/Constants";
import {version as appVersion} from "../package.json";

class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			deviceIdentification: "aaaaaaaaaa",
			accountIdentification: "0W4qcE5aXoKq9OzvHxj2",
			pushEnabled: false,
			pushToken: undefined,
			pushType: PushTypes.FCMUniversal,
			referer: document.URL,
			type: DeviceTypes.Web,
			userAdditionalInformation: {testKey: "testValue"},
			version: appVersion,
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
					pushEnabled={this.state.pushEnabled}
					pushToken={this.state.pushToken}
					pushType={this.state.pushType}
					referer={this.state.referer}
					type={this.state.type}
					userAdditionalInformation={this.state.userAdditionalInformation}
					version={this.state.version}
				/>
				<Messaging
					accountIdentification={this.state.accountIdentification}
					apiDomain={this.state.apiDomain}
					deviceIdentification={this.state.deviceIdentification}
					onChange={this.handleOnConfigurationChange}
					pushEnabled={this.state.pushEnabled}
					pushToken={this.state.pushToken}
					pushType={this.state.pushType}
					referer={this.state.referer}
					type={this.state.type}
					userAdditionalInformation={this.state.userAdditionalInformation}
					version={this.state.version}
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
