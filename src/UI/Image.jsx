import React, {Component} from "react";
import PropTypes from "prop-types";
import Api from "../Api/Api";
import ApiEventTarget from "../Api/ApiEventTarget";
import {media} from "../Api/Constants/Events";
import gfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import * as styles from "./Image.module.css";
import ImageViewer from "./ImageViewer";

class Image extends Component {
	constructor(props) {
		super(props);

		// state
		this.state = {
			showImageViewer: false,
			imageUrl: null,
			isLoading: true,
		};
	}

	componentDidMount() {
		ApiEventTarget.addEventListener(media, this.handleMediaError);

		const {
			year,
			month,
			day,
			filename,
		} = this.props.media;
		this.props.api.getMedia(year, month, day, filename)
			.then((mediaBlob) => {
				this.setState(() => ({isLoading: false}));

				if(!mediaBlob)
					return;


				// Convert blob to data: url
				// and save it in state
				const reader = new FileReader();
				reader.readAsDataURL(mediaBlob);
				reader.onloadend = () => {
					this.setState(() => ({imageUrl: reader.result}));
				};
			});
	}

	componentWillUnmount() {
		ApiEventTarget.removeEventListener(media, this.handleMediaError);
	}

	handleMediaError(err) {
		// TODO: Handle errors correctly
		console.error("GetMedia error:", err);
	}

	handleToggleImageViewer = () => {
		this.setState(state => ({showImageViewer: !state.showImageViewer}));
	};

	render() {
		// Don't load if this is an unsupported mime type
		if(!this.props.media.mimeType.startsWith("image/"))
			return null;


		// Don't load if we have no content (yet)
		if(this.state.isLoading)
			return null;


		// TODO: What should we render if an image is loading?

		const error = "_Unable to load image_";
		const inputType = "image";

		return (
			<>
				{
					this.state.imageUrl
						? <input
								alt={this.props.media.description}
								className={styles.image}
								onClick={this.handleToggleImageViewer}
								src={this.state.imageUrl}
								type={inputType}
						  />
						: <ReactMarkdown remarkPlugins={[gfm]} skipHtml={true}>
							{error}
						</ReactMarkdown>
				}
				{
					this.state.showImageViewer
					&& <ImageViewer
							alt={this.props.media.description}
							onClose={this.handleToggleImageViewer}
							src={this.state.imageUrl}
					   />
				}
			</>
		);
	}
}

Image.propTypes = {
	api: PropTypes.instanceOf(Api),
	media: PropTypes.shape({
		day: PropTypes.string.isRequired,
		description: PropTypes.string.isRequired,
		filename: PropTypes.string.isRequired,
		id: PropTypes.string.isRequired,
		mimeType: PropTypes.string.isRequired,
		month: PropTypes.string.isRequired,
		year: PropTypes.string.isRequired,
	}),
};

export default Image;
