import React, {Component} from "react";
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
		// eslint-disable-next-line no-invalid-this
		this.setState(state => ({showImageViewer: !state.showImageViewer}));
	}

	render() {
		// TODO: Not using in first version
		// return (
		// 	<>
		// 		<span onClick={this.handleToggleImageViewer}>
		// 			<img alt={this.props.media.description} src={this.props.media.id} />
		// 		</span>
		// 		{this.state.showImageViewer &&
		// 			<ImageViewer media={this.props.media} onClose={this.handleToggleImageViewer} />}
		// 	</>
		// );

		return (
			<>
			</>
		);
	}
}

Image.propTypes = {
	media: PropTypes.shape({
		id: PropTypes.string.isRequired,
		description: PropTypes.string,
	}),
};

export default Image;
