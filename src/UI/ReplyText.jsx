import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./ReplyText.module.css";
import TextareaAutosize from "react-textarea-autosize";
import {InterfaceTextsContext} from "./Scripts/Context";

class ReplyText extends Component {
	constructor(props) {
		super(props);

		this.textArea = React.createRef();
	}

	handleKeyDown = (e) => {
		if(this.props.isMobile)
			return;

		const enterKey = 13;
		if(e.keyCode === enterKey && e.shiftKey === false) {
			e.preventDefault();
			this.props.onSubmit();
		}
	}

	handleFocus = () => {
		if(this.props.isMobile)
			this.props.fitToIDeviceScreen();
		this.props.restartPolling();
	};

	handleBlur = () => {
		if(this.props.isMobile)
			this.props.fitToIDeviceScreen();
	};

	render() {
		const maxRows = 3;

		return (
			<InterfaceTextsContext.Consumer>
				{
					interfaceTexts => (
						<div className={styles.text}>
							<TextareaAutosize
								aria-label={interfaceTexts.ariaLabelTextInput}
								maxRows={maxRows}
								onBlur={this.handleBlur}
								onChange={this.props.onChange}
								onFocus={this.handleFocus}
								onKeyDown={this.handleKeyDown}
								placeholder={this.props.placeholder}
								ref={this.textArea}
								value={this.props.value}
							/>
						</div>
					)
				}
			</InterfaceTextsContext.Consumer>
		);
	}
}

ReplyText.propTypes = {
	fitToIDeviceScreen: PropTypes.func,
	isMobile: PropTypes.bool,
	onChange: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	placeholder: PropTypes.string,
	restartPolling: PropTypes.func,
	value: PropTypes.string,
};

export default ReplyText;
