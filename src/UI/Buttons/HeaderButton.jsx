import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./HeaderButton.module.css";
import {BUTTONMENU, BUTTONMINIMIZE, BUTTONCLOSE} from "../interfaceTexts.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBars} from "@fortawesome/free-solid-svg-icons/faBars";
import {faWindowMinimize} from "@fortawesome/free-regular-svg-icons/faWindowMinimize";
import {faTimes} from "@fortawesome/free-solid-svg-icons/faTimes";

class HeaderButton extends Component {
	render() {
		let icon;
		let className;
		let ariaLabel;
		const typeButton = "button";
		if(this.props.icon === "menu") {
			icon = faBars;
			className = styles.menu;
			ariaLabel = BUTTONMENU;
		} else if(this.props.icon === "minimize") {
			icon = faWindowMinimize;
			className = styles.minimize;
			ariaLabel = BUTTONMINIMIZE;
		} else if(this.props.icon === "close") {
			icon = faTimes;
			className = styles.close;
			ariaLabel = BUTTONCLOSE;
		}

		return (
			<button aria-label={ariaLabel} className={className} onClick={this.props.handleOnClick} type={typeButton}>
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
