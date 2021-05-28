import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./ReplyText.module.css";
import TextareaAutosize from "react-textarea-autosize";

class ReplyText extends Component {
	onKey = (e) => {
		const enterKey = 13;
		if(e.keyCode === enterKey && e.shiftKey === false) {
			e.preventDefault();
			// eslint-disable-next-line no-invalid-this
			this.props.handleOnSubmit();
		}
	}

	render() {
		const placeholder = "Type here your message...";
		const maxRows = 3;

		return (
			<div className={styles.text}>
				<TextareaAutosize
					maxRows={maxRows}
					onChange={this.props.handleOnChange}
					onKeyDown={this.onKey}
					placeholder={placeholder}
					value={this.props.value}
				/>
			</div>
		);
	}
}

ReplyText.propTypes = {
	handleOnChange: PropTypes.func.isRequired,
	handleOnSubmit: PropTypes.func.isRequired,
	value: PropTypes.string,
};

export default ReplyText;
