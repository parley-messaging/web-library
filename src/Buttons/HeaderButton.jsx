import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./HeaderButton.module.css";
import {BUTTONMENU, BUTTONMINIMIZE, BUTTONCLOSE} from "../interfaceTexts.js";

// Requirements
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBars} from "@fortawesome/pro-regular-svg-icons/faBars";
import {faWindowMinimize} from "@fortawesome/pro-regular-svg-icons/faWindowMinimize";
import {faTimes} from "@fortawesome/pro-regular-svg-icons/faTimes";

class HeaderButton extends Component {
	render() {
		let icon;
		let className;
		let altText;
		const typeButton = "button";
		if(this.props.icon === "menu") {
			icon = faBars;
			className = styles.menu;
			altText = BUTTONMENU;
		}
		if(this.props.icon === "minimize") {
			icon = faWindowMinimize;
			className = styles.minimize;
			altText = BUTTONMINIMIZE;
		}
		if(this.props.icon === "close") {
			icon = faTimes;
			className = styles.close;
			altText = BUTTONCLOSE;
		}

		return (
			<button aria-label={altText} className={className} onClick={this.props.handleOnClick} type={typeButton}>
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
