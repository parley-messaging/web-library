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

	onKey = (e) => {
		// eslint-disable-next-line no-invalid-this
		if(this.props.isMobile)
			return;

		const enterKey = 13;
		if(e.keyCode === enterKey && e.shiftKey === false) {
			e.preventDefault();
			// eslint-disable-next-line no-invalid-this
			this.props.handleOnSubmit();
		}
	}

	handleOnFocus = (event) => {
		// eslint-disable-next-line no-invalid-this
		if(this.props.isMobile)
			// eslint-disable-next-line no-invalid-this
			this.props.fitToIDeviceScreen();
	};

	handleOnBlur = (event) => {
		// eslint-disable-next-line no-invalid-this
		if(this.props.isMobile)
			// eslint-disable-next-line no-invalid-this
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
					onKeyDown={this.onKey}
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
