import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Announcement.module.css";
import ReactMarkdown from "react-markdown";

export const welcomeType = "welcome";
export const stickyType = "sticky";

class Announcement extends Component {
	render() {
		let classNames = styles.center;
		if(this.props.type === welcomeType)
			classNames += ` ${styles.welcome}`;
		 else if(this.props.type === stickyType)
			classNames += ` ${styles.sticky}`;


		return (
			<ReactMarkdown className={classNames} skipHtml={true}>
				{this.props.message}
			</ReactMarkdown>
		);
	}
}

Announcement.propTypes = {
	message: PropTypes.string.isRequired,
	type: PropTypes.oneOf([
		welcomeType, stickyType,
	]).isRequired,
};

export default Announcement;
