import React, {Component} from "react";
import PropTypes from "prop-types";

export default class ReplyButton extends Component {
	handleClick = (e) => {
		e.preventDefault();

		// TODO: somehow set the props.payload in the reply text field...
	};

	render() {
		return (
			<button className={this.props.className} onClick={this.handleClick}>
				{this.props.title}
			</button>
		);
	}
}

ReplyButton.propTypes = {
	className: PropTypes.string,
	payload: PropTypes.string.isRequired,
	title: PropTypes.string,
};
