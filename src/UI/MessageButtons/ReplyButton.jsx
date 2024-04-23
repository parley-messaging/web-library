import React, {Component} from "react";
import PropTypes from "prop-types";

export default class ReplyButton extends Component {
	handleClick = (e) => {
		e.preventDefault();

		this.props.onClick(this.props.payload);
	};

	render() {
		const name = "ReplyButton";

		return (
			<button className={this.props.className} name={name} onClick={this.handleClick}>
				{this.props.title}
			</button>
		);
	}
}

ReplyButton.propTypes = {
	className: PropTypes.string,
	onClick: PropTypes.func.isRequired,
	payload: PropTypes.string.isRequired,
	title: PropTypes.string,
};
