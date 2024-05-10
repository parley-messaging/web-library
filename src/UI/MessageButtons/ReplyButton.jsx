import React, {Component} from "react";
import PropTypes from "prop-types";
import Api from "../../Api/Api";

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
			<button className={this.props.className} disabled={this.state.disabled} name={name} onClick={this.handleClick}>
				{this.props.title}
			</button>
		);
	}
}

ReplyButton.propTypes = {
	api: PropTypes.instanceOf(Api),
	className: PropTypes.string,
	payload: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
};
