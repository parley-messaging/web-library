import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Button.module.css";

export default class WebUrlButton extends Component {
	handleClick = (e) => {
		e.preventDefault();

		window.open(this.props.payload, "_blank", "noopener").focus();
	};

	render() {
		const name = "WebUrlButton";

		return (
			<button className={styles.button} name={name} onClick={this.handleClick}>
				{this.props.title || this.props.payload}
			</button>
		);
	}
}

WebUrlButton.propTypes = {
	payload: PropTypes.string.isRequired,
	title: PropTypes.string,
};
