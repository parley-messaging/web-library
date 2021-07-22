import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./DateGroup.module.css";


class DateGroup extends Component {
	render() {
		const toMillisecondsMultiplier = 1000;

		return (
			<div className={styles.messageBubble}>
				<span className={styles.date}>
					{new Date(this.props.timestamp * toMillisecondsMultiplier).toLocaleDateString()}
				</span>
			</div>
		);
	}
}

DateGroup.propTypes = {timestamp: PropTypes.number.isRequired};

export default DateGroup;
