import React from "react";
import PropTypes from "prop-types";

class Configuration extends React.Component {
	constructor(props) {
		super(props);

		this.handleOnChange = this.handleOnChange.bind(this);
	}

	render() {
		const header = "Configuration";
		const textInput = "text";
		const booleanInput = "checkbox";

		const deviceIdentificationInput = "deviceIdentification";
		const deviceIdentificationLabel = "Device identification: ";
		const pushTokenInput = "pushToken";
		const pushTokenLabel = "Push token: ";
		const pushTypeInput = "pushType";
		const pushTypeLabel = "Push type: ";
		const pushEnabledInput = "pushEnabled";
		const pushEnabledLabel = "Push enabled: ";
		const userAdditionalInformationInput = "userAdditionalInformation";
		const userAdditionalInformationLabel = "User additional information: ";
		const typeInput = "type";
		const typeLabel = "Device type: ";
		const versionInput = "version";
		const versionLabel = "Device version: ";
		const refererInput = "referer";
		const refererLabel = "Referer url: ";

		const accountIdentificationInput = "accountIdentification";
		const accountIdentificationLabel = "Account identification: ";
		const apiDomainInput = "apiDomain";
		const apiDomainLabel = "API Domain: ";
		return (
			<>
				<h1>{header}</h1>
				<label htmlFor={deviceIdentificationInput}>{deviceIdentificationLabel}</label>
				<input
					id={deviceIdentificationInput} onChange={this.handleOnChange} type={textInput}
					value={this.props.deviceIdentification}
				/>
				<br />
				<label htmlFor={pushTokenInput}>{pushTokenLabel}</label>
				<input
					id={pushTokenInput} onChange={this.handleOnChange} type={textInput}
					value={this.props.pushToken}
				/>
				<br />
				<label htmlFor={pushTypeInput}>{pushTypeLabel}</label>
				<input
					id={pushTypeInput} onChange={this.handleOnChange} type={textInput}
					value={this.props.pushType}
				/>
				<br />
				<label htmlFor={pushEnabledInput}>{pushEnabledLabel}</label>
				<input
					id={pushEnabledInput} onChange={this.handleOnChange} type={booleanInput}
					value={this.props.pushEnabled}
				/>
				<br />
				<label htmlFor={userAdditionalInformationInput}>{userAdditionalInformationLabel}</label>
				<textarea
					id={userAdditionalInformationInput} onChange={this.handleOnChange}
					value={JSON.stringify(this.props.userAdditionalInformation)}
				/>
				<br />
				<label htmlFor={typeInput}>{typeLabel}</label>
				<input
					id={typeInput} onChange={this.handleOnChange} type={textInput}
					value={this.props.type}
				/>
				<br />
				<label htmlFor={versionInput}>{versionLabel}</label>
				<input
					id={versionInput} onChange={this.handleOnChange} type={textInput}
					value={this.props.version}
				/>
				<br />
				<label htmlFor={refererInput}>{refererLabel}</label>
				<input
					id={refererInput} onChange={this.handleOnChange} type={textInput}
					value={this.props.referer}
				/>
				<br />
				<label htmlFor={accountIdentificationInput}>{accountIdentificationLabel}</label>
				<input
					id={accountIdentificationInput} onChange={this.handleOnChange} type={textInput}
					value={this.props.accountIdentification}
				/>
				<br />
				<label htmlFor={apiDomainInput}>{apiDomainLabel}</label>
				<input
					id={apiDomainInput} onChange={this.handleOnChange} type={textInput}
					value={this.props.apiDomain}
				/>
			</>
		);
	}

	handleOnChange(event) {
		if(event.target.type === "checkbox")
			this.props.onChange(event.target.id, event.target.checked);
		 else
			this.props.onChange(event.target.id, event.target.value);
	}
}

Configuration.propTypes = {
	accountIdentification: PropTypes.string,
	apiDomain: PropTypes.string,
	deviceIdentification: PropTypes.string,
	onChange: PropTypes.func,
	pushEnabled: PropTypes.bool,
	pushToken: PropTypes.string,
	pushType: PropTypes.number,
	referer: PropTypes.string,
	type: PropTypes.number,
	userAdditionalInformation: PropTypes.object,
	version: PropTypes.string,
};

export default Configuration;
