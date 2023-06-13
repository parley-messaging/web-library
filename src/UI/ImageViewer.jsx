import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./ImageViewer.module.css";
import {faTimes} from "@fortawesome/free-solid-svg-icons/faTimes";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

class ImageViewer extends Component {
	render() {
		const iconSize = "3x";

		return (
			<div className={styles.container}>
				<img alt={this.props.alt} className={styles.image} src={this.props.src} />
				<button className={styles.closeButton} onClick={this.props.onClose}>
					<FontAwesomeIcon icon={faTimes} size={iconSize} />
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
