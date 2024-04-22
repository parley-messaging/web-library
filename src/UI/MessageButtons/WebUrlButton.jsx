import React, {Component} from "react";
import PropTypes from "prop-types";

// TODO: Write cypress tests

export default class WebUrlButton extends Component {
	handleClick = (e) => {
		e.preventDefault();

		window.open(this.props.payload, "_blank").focus();
	};

	render() {
		return (
			<button className={this.props.className} onClick={this.handleClick}>
				{this.props.title}
			</button>
		);
	}
}

WebUrlButton.propTypes = {
	className: PropTypes.string,
	payload: PropTypes.string.isRequired,
	title: PropTypes.string,
};
