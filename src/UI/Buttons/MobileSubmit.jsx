import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./MobileSubmit.module.css";

// Requirements
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowCircleRight} from "@fortawesome/free-solid-svg-icons/faArrowCircleRight";

class MobileSubmit extends Component {
	render() {
		const typeButton = "button";
		const ariaLabel = "send message";

		return (
			<button
				aria-label={ariaLabel}
				className={styles.mobile}
				onClick={this.props.onClick}
				type={typeButton}
			>
				<FontAwesomeIcon icon={faArrowCircleRight} />
			</button>
		);
	}
}

MobileSubmit.propTypes = {onClick: PropTypes.func.isRequired};

export default MobileSubmit;
