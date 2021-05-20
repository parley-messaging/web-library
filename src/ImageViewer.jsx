import React, {Component} from "react";
import PropTypes from "prop-types";

class ImageViewer extends Component {
	render() {
		return (
			<div>
			</div>
		);
	}
}

ImageViewer.propTypes = {
	media: PropTypes.shape({
		id: PropTypes.string.isRequired,
		description: PropTypes.string,
	}),
	onClose: PropTypes.func,
};

export default ImageViewer;
