import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Button.module.css";

export default class CallButton extends Component {
	handleClick = (e) => {
		e.preventDefault();

		// There is no need to open this in a new tab,
		// as this will only confuse the client because an empty tab will open
		// So that is why we use target "_self"
		window.open(`${this.props.payload}`, "_self", "noopener,noreferrer");
	};

	render() {
		const name = "CallButton";

		return (
			<button className={styles.button} name={name} onClick={this.handleClick}>
				{this.props.title || this.props.payload}
			</button>
		);
	}
}

CallButton.propTypes = {
	payload: PropTypes.string.isRequired,
	title: PropTypes.string,
};
