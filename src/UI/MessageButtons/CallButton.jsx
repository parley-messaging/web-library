import React, {Component} from "react";
import PropTypes from "prop-types";

export default class CallButton extends Component {
	handleClick = (e) => {
		e.preventDefault();

		// There is no need to open this in a new tab,
		// as this will only confuse the client because an empty tab will open
		// So that is why we use target "_self"
		window.open(`${this.props.payload}`, "_self");
	};

	render() {
		const name = "CallButton";

		return (
			<button className={this.props.className} name={name} onClick={this.handleClick}>
				{this.props.title || this.props.payload}
			</button>
		);
	}
}

CallButton.propTypes = {
	className: PropTypes.string,
	payload: PropTypes.string.isRequired,
	title: PropTypes.string,
};
