import React from "react";
import PropTypes from "prop-types";

class Configuration extends React.Component {
	constructor(props) {
		super(props);

		this.handleOnChange = this.handleOnChange.bind(this);
	}

	render() {
		const header = "Configuration";
		const inputType = "text";
		const deviceIdentificationInput = "deviceIdentification";
		const deviceIdentificationLabel = "Device identification: ";
		const accountIdentificationInput = "accountIdentification";
		const accountIdentificationLabel = "Account identification: ";
		const apiDomainInput = "apiDomain";
		const apiDomainLabel = "API Domain: ";
		return (
			<>
				<h1>{header}</h1>
				<label htmlFor={deviceIdentificationInput}>{deviceIdentificationLabel}</label>
				<input
					id={deviceIdentificationInput} onChange={this.handleOnChange} type={inputType}
					value={this.props.deviceIdentification}
				/>
				<br />
				<label htmlFor={accountIdentificationInput}>{accountIdentificationLabel}</label>
				<input
					id={accountIdentificationInput} onChange={this.handleOnChange} type={inputType}
					value={this.props.accountIdentification}
				/>
				<br />
				<label htmlFor={apiDomainInput}>{apiDomainLabel}</label>
				<input
					id={apiDomainInput} onChange={this.handleOnChange} type={inputType}
					value={this.props.apiDomain}
				/>
			</>
		);
	}

	handleOnChange(event) {
		this.props.onChange(event.target.id, event.target.value);
	}
}

Configuration.propTypes = {
	deviceIdentification: PropTypes.string,
	accountIdentification: PropTypes.string,
	apiDomain: PropTypes.string,
	onChange: PropTypes.func,
};

export default Configuration;
