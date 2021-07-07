import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./ReplyText.module.css";
import TextareaAutosize from "react-textarea-autosize";

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
		const placeholder = "Type here your message...";
		const maxRows = 3;

		return (
			<div className={styles.text}>
				<TextareaAutosize
					maxRows={maxRows}
					onBlur={this.handleBlur}
					onChange={this.props.onChange}
					onFocus={this.handleFocus}
					onKeyDown={this.handleKeyDown}
					placeholder={placeholder}
					ref={this.textArea}
					value={this.props.value}
				/>
			</div>
		);
	}
}

ReplyText.propTypes = {
	fitToIDeviceScreen: PropTypes.func,
	isMobile: PropTypes.bool,
	onChange: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	restartPolling: PropTypes.func,
	value: PropTypes.string,
};

export default ReplyText;
