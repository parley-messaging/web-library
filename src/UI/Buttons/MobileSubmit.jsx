import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./MobileSubmit.module.css";

// Requirements
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowCircleRight} from "@fortawesome/free-solid-svg-icons/faArrowCircleRight";

class MobileSubmit extends Component {
	render() {
		return (
			<button className={styles.mobile}>
				<FontAwesomeIcon icon={faArrowCircleRight} onClick={this.props.handleOnClick} />
			</button>
		);
	}
}

MobileSubmit.propTypes = {handleOnClick: PropTypes.func.isRequired};

export default MobileSubmit;
