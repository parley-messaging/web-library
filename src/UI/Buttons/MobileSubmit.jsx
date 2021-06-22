import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./MobileSubmit.module.css";

// Requirements
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowCircleRight} from "@fortawesome/free-solid-svg-icons/faArrowCircleRight";

class MobileSubmit extends Component {
	render() {
		return (
			<button className={styles.mobile} onClick={this.props.handleOnClick}>
				<FontAwesomeIcon icon={faArrowCircleRight} />
			</button>
		);
	}
}

MobileSubmit.propTypes = {handleOnClick: PropTypes.func.isRequired};

export default MobileSubmit;
