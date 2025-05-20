import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Button.module.css";
import {InterfaceTextsContext} from "../Scripts/Context";

export default class WebUrlButton extends Component {
	static contextType = InterfaceTextsContext;

	handleClick = (e) => {
		e.preventDefault();

		window.open(this.props.payload, "_blank", "noopener,noreferrer").focus();
	};

	render() {
		const name = "WebUrlButton";

		return (
			<button
				aria-label={this.context.ariaLabelButtonWebUrl}
				className={styles.button}
				name={name}
				onClick={this.handleClick}
			>
				{this.props.title || this.props.payload}
			</button>
		);
	}
}

WebUrlButton.propTypes = {
	payload: PropTypes.string.isRequired,
	title: PropTypes.string,
};
