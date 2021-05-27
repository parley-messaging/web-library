import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./HeaderButton.module.css";

// Requirements
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBars} from "@fortawesome/pro-regular-svg-icons/faBars";
import {faWindowMinimize} from "@fortawesome/pro-regular-svg-icons/faWindowMinimize";
import {faTimes} from "@fortawesome/pro-regular-svg-icons/faTimes";

class HeaderButton extends Component {
	render() {
		let icon;
		let className;
		if(this.props.icon === "menu") {
			icon = faBars;
			className = styles.menu;
		}
		if(this.props.icon === "minimize") {
			icon = faWindowMinimize;
			className = styles.minimize;
		}
		if(this.props.icon === "close") {
			icon = faTimes;
			className = styles.close;
		}

		return (
			<button className={className} onClick={this.props.handleOnClick}>
				<FontAwesomeIcon icon={icon} />
			</button>
		);
	}
}

HeaderButton.propTypes = {
	handleOnClick: PropTypes.func.isRequired,
	icon: PropTypes.oneOf([
		"menu",
		"minimize",
		"close",
	]).isRequired,
};

export default HeaderButton;
