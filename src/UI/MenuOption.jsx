import React, {Component} from "react";
import PropTypes from "prop-types";

// Requirements
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons/faTimes";
import {faDownload} from "@fortawesome/free-solid-svg-icons/faDownload";
import {faInfo} from "@fortawesome/free-solid-svg-icons/faInfo";

export const closeIcon = "close";
export const downloadIcon = "download";
export const infoIcon = "close";

class MenuOption extends Component {
	constructor(props) {
		super(props);

		this.textArea = React.createRef();
	}

	render() {
		let icon;
		let {text} = this.props;
		if(this.props.icon === closeIcon) {
			icon = faTimes;
			text = "";
		} else if(this.props.icon === downloadIcon) {
			icon = faDownload;
		} else if(this.props.icon === infoIcon) {
			icon = faInfo;
		}

		return (
			<button
				aria-label={this.props.text}
				onClick={this.props.onClick}
			>
				<FontAwesomeIcon icon={icon} /><span>{text}</span>
			</button>
		);
	}
}

MenuOption.propTypes = {
	icon: PropTypes.oneOf([
		closeIcon,
		downloadIcon,
		infoIcon,
	]).isRequired,
	onClick: PropTypes.func.isRequired,
	text: PropTypes.string.isRequired,
};

export default MenuOption;
