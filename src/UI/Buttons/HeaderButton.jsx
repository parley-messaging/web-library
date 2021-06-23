import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./HeaderButton.module.css";
import {BUTTONMENU, BUTTONMINIMIZE, BUTTONCLOSE} from "../interfaceTexts.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBars} from "@fortawesome/free-solid-svg-icons/faBars";
import {faWindowMinimize} from "@fortawesome/free-regular-svg-icons/faWindowMinimize";
import {faTimes} from "@fortawesome/free-solid-svg-icons/faTimes";

export const menuType = "menu";
export const minimizeType = "minimize";
export const closeType = "close";

class HeaderButton extends Component {
	render() {
		let icon;
		let className;
		let ariaLabel;
		const typeButton = "button";
		if(this.props.type === menuType) {
			icon = faBars;
			className = styles.menu;
			ariaLabel = BUTTONMENU;
		} else if(this.props.type === minimizeType) {
			icon = faWindowMinimize;
			className = styles.minimize;
			ariaLabel = BUTTONMINIMIZE;
		} else if(this.props.type === closeType) {
			icon = faTimes;
			className = styles.close;
			ariaLabel = BUTTONCLOSE;
		}

		return (
			<button aria-label={ariaLabel} className={className} onClick={this.props.handleClick} type={typeButton}>
				<FontAwesomeIcon icon={icon} />
			</button>
		);
	}
}

HeaderButton.propTypes = {
	handleClick: PropTypes.func.isRequired,
	type: PropTypes.oneOf([
		menuType,
		minimizeType,
		closeType,
	]).isRequired,
};

export default HeaderButton;
