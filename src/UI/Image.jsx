import {Component} from "react";
import PropTypes from "prop-types";

// components
// import ImageViewer from "./ImageViewer";

class Image extends Component {
	constructor(props) {
		super(props);

		// state
		this.state = {showImageViewer: false};
	}

	handleToggleImageViewer = () => {
		this.setState(state => ({showImageViewer: !state.showImageViewer}));
	}

	render() {
		// Not using in first version
		// return (
		// 	<>
		// 		<span onClick={this.handleToggleImageViewer}>
		// 			<img alt={this.props.media.description} src={this.props.media.id} />
		// 		</span>
		// 		{this.state.showImageViewer &&
		// 			<ImageViewer media={this.props.media} onClose={this.handleToggleImageViewer} />}
		// 	</>
		// );

		return null;
	}
}

Image.propTypes = {
	media: PropTypes.shape({
		description: PropTypes.string,
		id: PropTypes.string.isRequired,
	}),
};

export default Image;
