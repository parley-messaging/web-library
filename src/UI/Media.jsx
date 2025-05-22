import React, {Component} from "react";
import PropTypes from "prop-types";
import Api from "../Api/Api";
import * as styles from "./Media.module.css";
import MessageTypes from "../Api/Constants/MessageTypes";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
	faFileAlt,
	faFileAudio, faFileExcel, faFileLines,
	faFilePdf, faFilePowerpoint,
	faFileVideo,
	faFileWord,
} from "@fortawesome/free-regular-svg-icons";
import {faArrowDown} from "@fortawesome/free-solid-svg-icons";
import {isSupportedMediaType} from "../Api/Constants/SupportedMediaTypes";
import Logger from "js-logger";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import mediaShape from "./shapes/media";
import {InterfaceTextsContext} from "./Scripts/Context";

class Media extends Component {
	static contextType = InterfaceTextsContext;

	constructor(props) {
		super(props);

		// state
		this.state = {
			isLoading: false,
			errorText: "",
			fileDownloadUrl: null,
		};
	}


	handleDownload = () => {
		this.setState(() => ({isLoading: true}));
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

				const reader = new FileReader();
				const fileDownloadUrl = URL.createObjectURL(mediaBlob);
				reader.onloadend = () => {
					const link = document.createElement("a");
					link.href = fileDownloadUrl;
					link.download = filename;
					link.click();
				};
				reader.readAsArrayBuffer(mediaBlob);
			})
			.finally(() => {
				this.setState(() => ({isLoading: false}));
			});
	};

	convertFileToIcon = () => {
		const {mimeType} = this.props.media;
		const iconClass = `${styles.icon} `;

		if(mimeType === "application/pdf")
			return <FontAwesomeIcon className={iconClass + styles.iconFilePdf} icon={faFilePdf} />;
		else if([
			"application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		].indexOf(mimeType) > -1)
			return <FontAwesomeIcon className={iconClass + styles.iconFileWord} icon={faFileWord} />;
		else if([
			"application/msexcel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		].indexOf(mimeType) > -1)
			return <FontAwesomeIcon className={iconClass + styles.iconFileExcel} icon={faFileExcel} />;
		else if([
			"application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		].indexOf(mimeType) > -1)
			return <FontAwesomeIcon className={iconClass + styles.iconFilePowerpoint} icon={faFilePowerpoint} />;
		else if(mimeType.startsWith("text/"))
			return <FontAwesomeIcon className={iconClass + styles.iconFileText} icon={faFileLines} />;
		else if(mimeType.startsWith("audio/"))
			return <FontAwesomeIcon className={iconClass + styles.iconFileAudio} icon={faFileAudio} />;
		else if(mimeType.startsWith("video/"))
			return <FontAwesomeIcon className={iconClass + styles.iconFileVideo} icon={faFileVideo} />;


		return <FontAwesomeIcon className={iconClass + styles.iconFileUnknown} icon={faFileAlt} />;
	};

	componentDidMount() {
		// Don't load if this is an unsupported mime type
		if(!isSupportedMediaType(this.props.media.mimeType)) {
			Logger.debug(`Mime type '${this.props.media.mimeType}' is not supported!`);
			this.setState(() => ({errorText: "_Unsupported media_"}));
		}
	}


	render() {
		const icon = this.convertFileToIcon();

		if(this.state.errorText) {
			return (
				<ReactMarkdown remarkPlugins={[gfm]} skipHtml={true}>
					{this.state.errorText}
				</ReactMarkdown>
			);
		}

		return (
			<div aria-label={this.props["aria-label"]} className={styles.messageBoxMedia}>
				<span>{icon}</span>
				<label>
					{this.props.media.description || this.props.media.filename}
				</label>
				<button
					aria-label={this.context.ariaLabelButtonDownloadMedia}
					className={styles.messageBoxMediaDownload}
					disabled={this.state.isLoading}
					onClick={this.handleDownload}
				>
					{
						this.state.isLoading
							? <span className={styles.loading} />
							: <span className={styles.wrapperDownloadAltIcon}>
								<FontAwesomeIcon icon={faArrowDown} />
							  </span>
					}
				</button>
			</div>
		);
	}
}

Media.propTypes = {
	api: PropTypes.instanceOf(Api).isRequired,
	"aria-label": PropTypes.string,
	media: PropTypes.shape(mediaShape).isRequired,
	messageType: PropTypes.oneOf([
		MessageTypes.Agent,
		MessageTypes.User,
	]).isRequired,
};

export default Media;
