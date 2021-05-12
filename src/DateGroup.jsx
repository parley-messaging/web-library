import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Date.module.css";


class DateGroup extends Component {
	render() {
		const toSecondsMultiplier = 1000;

		return (
			<span className={styles.date}>
				{new Date(this.props.timestamp * toSecondsMultiplier).toLocaleDateString()}
			</span>
		);
	}
}

DateGroup.propTypes = {timestamp: PropTypes.number.isRequired};

export default DateGroup;
