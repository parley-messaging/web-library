import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./MobileSubmit.module.css";

// Requirements
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowCircleRight} from "@fortawesome/free-solid-svg-icons/faArrowCircleRight";

class MobileSubmit extends Component {
	render() {
		const typeButton = "button";
		const ariaLabel = "send message";
		const id = "submitButton";

		return (
			<button
				aria-label={ariaLabel}
				className={styles.mobile}
				id={id}
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
