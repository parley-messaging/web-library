import React, {Component} from "react";
import PropTypes from "prop-types";
import Api from "../Api/Api";
import gfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import * as styles from "./Image.module.css";
import ImageViewer from "./ImageViewer";
import MessageTypes from "../Api/Constants/MessageTypes";

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
		const {
			year,
			month,
			day,
			filename,
		} = this.props.media;
		this.props.api.getMedia(year, month, day, filename)
			.then((mediaBlob) => {
				if(!mediaBlob)
					return;


				// Convert blob to data: url
				// and save it in state
				const reader = new FileReader();
				reader.readAsDataURL(mediaBlob);
				reader.onloadend = () => {
					this.setState(() => ({imageUrl: reader.result}));
				};
			})
			.finally(() => {
				this.setState(() => ({isLoading: false}));
			});
	}

	handleToggleImageViewer = () => {
		this.setState(state => ({showImageViewer: !state.showImageViewer}));
	};

	render() {
		// Don't load if this is an unsupported mime type
		if(!this.props.media.mimeType.startsWith("image/"))
			return null;


		// Don't load if we have no content (yet)
		if(this.state.isLoading) {
			return (
				<div className={styles.loadingContainer}>
					<span className={styles.loading} />
				</div>
			);
		}

		const error = "_Unable to load image_";
		const inputType = "image";
		const classNames = `${styles.image} ${this.props.messageType === MessageTypes.Agent ? styles.agent : styles.user}`;

		return (
			<>
				{
					this.state.imageUrl
						? <input
								alt={this.props.media.description}
								className={classNames}
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
	messageType: PropTypes.oneOf([
		MessageTypes.Agent,
		MessageTypes.User,
	]).isRequired,
};

export default Image;
