import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./ImageViewer.module.css";

class ImageViewer extends Component {
	render() {
		return (
			<div className={styles.container}>
				<img alt={this.props.alt} className={styles.image} src={this.props.src} />
				<button className={styles.closeButton} onClick={this.props.onClose}>
					Close
				</button>
			</div>
		);
	}
}

ImageViewer.propTypes = {
	alt: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired,
	src: PropTypes.string.isRequired,
};

export default ImageViewer;
