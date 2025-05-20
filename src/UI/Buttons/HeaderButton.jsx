import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./HeaderButton.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBars} from "@fortawesome/free-solid-svg-icons/faBars";
import {faWindowMinimize} from "@fortawesome/free-regular-svg-icons/faWindowMinimize";
import {faTimes} from "@fortawesome/free-solid-svg-icons/faTimes";
import {InterfaceTextsContext} from "../Scripts/Context";

export const menuType = "menu";
export const minimizeType = "minimize";
export const closeType = "close";

class HeaderButton extends Component {
	static contextType = InterfaceTextsContext;

	render() {
		let icon;
		let classNames = `${styles.button}`;
		let ariaLabel;
		const typeButton = "button";
		if(this.props.type === menuType) {
			icon = faBars;
			classNames += ` ${styles.menu}`;
			ariaLabel = this.context.ariaLabelButtonMenu;
		} else if(this.props.type === minimizeType) {
			icon = faWindowMinimize;
			classNames += ` ${styles.minimize}`;
			ariaLabel = this.context.ariaLabelButtonMinimize;
		} else if(this.props.type === closeType) {
			icon = faTimes;
			classNames += ` ${styles.close}`;
			ariaLabel = this.context.ariaLabelButtonClose;
		}

		return (
			<button
				aria-label={ariaLabel}
				className={classNames}
				onClick={this.props.onClick}
				tabIndex={this.props.tabIndex}
				type={typeButton}
			>
				<FontAwesomeIcon icon={icon} />
			</button>
		);
	}
}

HeaderButton.propTypes = {
	onClick: PropTypes.func.isRequired,
	tabIndex: PropTypes.number,
	type: PropTypes.oneOf([
		menuType,
		minimizeType,
		closeType,
	]).isRequired,
};

export default HeaderButton;
