import React, {Component} from "react";
import PropTypes from "prop-types";
import Api from "../../Api/Api";
import * as styles from "./Button.module.css";
import {InterfaceTextsContext} from "../Scripts/Context";

export default class ReplyButton extends Component {
	static contextType = InterfaceTextsContext;

	constructor(props) {
		super(props);

		this.state = {disabled: false};
	}

	handleClick = (e) => {
		e.preventDefault();

		this.setState({disabled: true}, () => {
			this.props.api.sendMessage(this.props.payload)
				.finally(() => this.setState({disabled: false}));
		});
	};

	render() {
		const name = "ReplyButton";
		const body = this.props.title || this.props.payload;

		return (
			<button
				aria-label={this.context.ariaLabelButtonPredefinedReply(body)}
				className={styles.button}
				disabled={this.state.disabled}
				name={name}
				onClick={this.handleClick}
			>
				{body}
			</button>
		);
	}
}

ReplyButton.propTypes = {
	api: PropTypes.instanceOf(Api),
	payload: PropTypes.string.isRequired,
	title: PropTypes.string,
};
