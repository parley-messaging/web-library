import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Announcement.module.css";
import ReactMarkdown from "react-markdown";

class Announcement extends Component {
	render() {
		return (
			<span className={styles.center}>
				<ReactMarkdown children={this.props.message} skipHtml={true} />
			</span>
		);
	}
}

Announcement.propTypes = {message: PropTypes.string.isRequired};

export default Announcement;
