import React, {Component} from "react";
import PropTypes from "prop-types";

// TODO: Write cypress tests

export default class CallButton extends Component {
	handleClick = (e) => {
		e.preventDefault();

		document.location.href = `tel://${this.props.payload}`;
	};

	render() {
		const name = "CallButton";

		return (
			<button className={this.props.className} name={name} onClick={this.handleClick}>
				{this.props.title}
			</button>
		);
	}
}

CallButton.propTypes = {
	className: PropTypes.string,
	payload: PropTypes.string.isRequired,
	title: PropTypes.string,
};
