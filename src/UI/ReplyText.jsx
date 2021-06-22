import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./ReplyText.module.css";
import TextareaAutosize from "react-textarea-autosize";

class ReplyText extends Component {
	constructor(props) {
		super(props);

		this.textArea = React.createRef();
	}

	componentDidMount() {
		this.textArea.current.focus();
	}

	handleOnKeyDown = (e) => {
		if(this.props.isMobile)
			return;

		const enterKey = 13;
		if(e.keyCode === enterKey && e.shiftKey === false) {
			e.preventDefault();
			this.props.handleOnSubmit();
		}
	}

	handleOnFocus = () => {
		if(this.props.isMobile)
			this.props.fitToIDeviceScreen();
	};

	handleOnBlur = () => {
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
					onBlur={this.handleOnBlur}
					onChange={this.props.handleOnChange}
					onFocus={this.handleOnFocus}
					onKeyDown={this.handleOnKeyDown}
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
	handleOnChange: PropTypes.func.isRequired,
	handleOnSubmit: PropTypes.func.isRequired,
	isMobile: PropTypes.bool,
	value: PropTypes.string,
};

export default ReplyText;
