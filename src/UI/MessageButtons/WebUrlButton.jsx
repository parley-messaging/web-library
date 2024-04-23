import React, {Component} from "react";
import PropTypes from "prop-types";

export default class WebUrlButton extends Component {
	handleClick = (e) => {
		e.preventDefault();

		window.open(this.props.payload, "_blank").focus();
	};

	render() {
		const name = "WebUrlButton";

		return (
			<button className={this.props.className} name={name} onClick={this.handleClick}>
				{this.props.title}
			</button>
		);
	}
}

WebUrlButton.propTypes = {
	className: PropTypes.string,
	payload: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
};
