import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Announcement.module.css";
import ReactMarkdown from "react-markdown";

class Announcement extends Component {
	render() {
		const classNames = `${styles.center} ${styles.announcement}`;
		return (
			<ReactMarkdown className={classNames} skipHtml={true}>
				{this.props.message}
			</ReactMarkdown>
		);
	}
}

Announcement.propTypes = {message: PropTypes.string.isRequired};

export default Announcement;
