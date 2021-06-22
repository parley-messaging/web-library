import {Component} from "react";
import PropTypes from "prop-types";

class ImageViewer extends Component {
	render() {
		return null;
	}
}

ImageViewer.propTypes = {
	media: PropTypes.shape({
		description: PropTypes.string,
		id: PropTypes.string.isRequired,
	}),
	onClose: PropTypes.func,
};

export default ImageViewer;
