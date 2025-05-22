import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Announcement.module.css";
import ReactMarkdown from "react-markdown";

class Announcement extends Component {
	render() {
		const classNames = `${styles.center} ${styles.announcement}`;

		return (
			<article>
				<ReactMarkdown className={classNames} skipHtml={true}>
					{this.props.message}
				</ReactMarkdown>
			</article>
		);
	}
}

Announcement.propTypes = {message: PropTypes.string.isRequired};

export default Announcement;
