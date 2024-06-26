import React, {Component} from "react";
import PropTypes from "prop-types";
import Api from "../../Api/Api";
import * as styles from "./Button.module.css";

export default class ReplyButton extends Component {
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

		return (
			<button
				className={styles.button}
				disabled={this.state.disabled}
				name={name}
				onClick={this.handleClick}
			>
				{this.props.title || this.props.payload}
			</button>
		);
	}
}

ReplyButton.propTypes = {
	api: PropTypes.instanceOf(Api),
	payload: PropTypes.string.isRequired,
	title: PropTypes.string,
};
