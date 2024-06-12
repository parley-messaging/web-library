import React, {Component} from "react";
import PropTypes from "prop-types";
import Api from "../Api/Api";
import gfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import * as styles from "./Image.module.css";
import ImageViewer from "./ImageViewer";
import MessageTypes from "../Api/Constants/MessageTypes";
import mediaShape from "./shapes/media";
import Logger from "js-logger";

class Image extends Component {
	constructor(props) {
		super(props);

		// state
		this.state = {
			showImageViewer: false,
			imageUrl: null,
			isLoading: true,
			errorText: "_Unable to load media_",
		};
	}

	componentDidMount() {
		// Don't load if this is an unsupported mime type
		if(!this.props.media.mimeType.startsWith("image/")) {
			this.setState(() => ({
				errorText: "_Unsupported media_",
				isLoading: false,
			}));
			Logger.debug(`Image has unsupported mimeType '${this.props.media.mimeType}', will not render anything`);
			return;
		}

		const {
			year,
			month,
			day,
			filename,
		} = this.props.media;
		this.props.api.getMedia(year, month, day, filename)
			.then((mediaBlob) => {
				if(!mediaBlob) {
					Logger.debug("Image blob from api is empty, will not render anything");
					return;
				}


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
		// Don't load if we have no content (yet)
		if(this.state.isLoading) {
			return (
				<div className={styles.loadingContainer}>
					<span className={styles.loading} />
				</div>
			);
		}

		const inputType = "image";
		const classNames = `${styles.image} ${this.props.messageType === MessageTypes.Agent ? styles.agent : styles.user}`;

		return (
			<div aria-label={this.props["aria-label"]}>
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
							{this.state.errorText}
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
			</div>
		);
	}
}

Image.propTypes = {
	api: PropTypes.instanceOf(Api),
	"aria-label": PropTypes.string,
	media: PropTypes.shape(mediaShape),
	messageType: PropTypes.oneOf([
		MessageTypes.Agent,
		MessageTypes.User,
	]).isRequired,
};

export default Image;
