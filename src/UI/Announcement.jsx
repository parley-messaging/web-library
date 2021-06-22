import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Announcement.module.css";
import ReactMarkdown from "react-markdown";

class Announcement extends Component {
	render() {
		return (
			<ReactMarkdown className={styles.center} skipHtml={true}>
				{this.props.message}
			</ReactMarkdown>
		);
	}
}

Announcement.propTypes = {message: PropTypes.string.isRequired};

export default Announcement;
