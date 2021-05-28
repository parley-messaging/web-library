import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./DateGroup.module.css";


class DateGroup extends Component {
	render() {
		const toSecondsMultiplier = 1000;

		return (
			<div className={styles.container}>
				<span className={styles.date}>
					{new Date(this.props.timestamp * toSecondsMultiplier).toLocaleDateString()}
				</span>
			</div>
		);
	}
}

DateGroup.propTypes = {timestamp: PropTypes.number.isRequired};

export default DateGroup;
