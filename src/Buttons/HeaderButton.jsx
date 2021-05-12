import React, {Component} from "react";
import PropTypes from "prop-types";

// Requirements
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBars} from "@fortawesome/pro-regular-svg-icons/faBars";
import {faWindowMinimize} from "@fortawesome/pro-regular-svg-icons/faWindowMinimize";
import {faTimes} from "@fortawesome/pro-regular-svg-icons/faTimes";

class HeaderButton extends Component {
	render() {
		let icon;
		if(this.props.icon === "menu")
			icon = faBars;
		if(this.props.icon === "minimize")
			icon = faWindowMinimize;
		if(this.props.icon === "close")
			icon = faTimes;

		return (
			<FontAwesomeIcon icon={icon} onClick={this.props.handleOnClick} />
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
