import React, {Component} from "react";
import PropTypes from "prop-types";
import Api from "../Api/Api";
import gfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import * as styles from "./Media.module.css";
import MessageTypes from "../Api/Constants/MessageTypes";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowDown, faFile, faFileAlt, faFileAudio, faFilePdf, faFileVideo} from "@fortawesome/free-solid-svg-icons";
import {isSupportedMediaType} from "../Api/Constants/SupportedMediaTypes";

class Media extends Component {
	constructor(props) {
		super(props);

		// state
		this.state = {
			isLoading: true,
			errorText: "_Unable to load media_",
			fileDownloadUrl: null,
		};
	}


	handleDownload = () => {
		const link = document.createElement("a");
		link.href = this.state.fileDownloadUrl;
		link.download = this.props.media.filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// ToDo @bouke: Het zou mooier zijn als er een mapping wordt gemaakt op basis van SupportedMediaTypes Volgende toevoegen
	// ToDo @bouke: Audio en video moeten nog een kleur bevatten
	// "application/msword",
	// "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	// "application/vnd.ms-excel",
	// "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	// "application/vnd.ms-powerpoint",
	convertFileToIcon = () => {
		const {mimeType} = this.props.media;
		if(mimeType.startsWith("application/pdf")) {
			return <FontAwesomeIcon className={styles.iconFilePdf} icon={faFilePdf} />;
		} else if(mimeType.startsWith("text")) {
			return <FontAwesomeIcon className={styles.iconFileTxtCsv} icon={faFile} />;
		} else if(mimeType.startsWith("audio")) {
			return (
				<FontAwesomeIcon
					icon={faFileAudio}
				/>
			);
		} else if(mimeType.startsWith("video")) {
			return (
				<FontAwesomeIcon
					icon={faFileVideo}
				/>
			);
		}
		return (
			<FontAwesomeIcon
				icon={faFileAlt} style={
				{
					color: "black",
					fontSize: "24px",
				}
			}
			/>
		);
	};

	componentDidMount() {
		// Don't load if this is an unsupported mime type
		if(!isSupportedMediaType(this.props.media.mimeType)) {
			this.setState(() => ({
				errorText: "_Unsupported media_",
				isLoading: false,
			}));
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
				if(!mediaBlob)
					return;


				const reader = new FileReader();
				const fileDownloadUrl = URL.createObjectURL(mediaBlob);
				reader.onloadend = () => {
					this.setState(() => ({fileDownloadUrl}));
				};
				reader.readAsArrayBuffer(mediaBlob);
			})
			.finally(() => {
				this.setState(() => ({isLoading: false}));
			});
	}


	render() {
		const icon = this.convertFileToIcon();

		if(this.state.isLoading) {
			return (
				<div className={styles.loadingContainer}>
					<span className={styles.loading} />
				</div>
			);
		}

		if(!this.state.fileDownloadUrl) {
			return (
				<ReactMarkdown remarkPlugins={[gfm]} skipHtml={true}>
					{this.state.errorText}
				</ReactMarkdown>
			);
		}

		return (
			<div className={styles.messageBoxMedia}>
				<span>{icon}</span>
				<label>
					{

						/* TODO: @gerben; cypress test this */
						this.props.media.description || this.props.media.filename}
				</label>
				<button
					className={styles.messageBoxMediaDownload}
					data-file-url={this.state.fileDownloadUrl}
					onClick={this.handleDownload}
				><span className={styles.wrapperDownloadAltIcon}>
					<FontAwesomeIcon icon={faArrowDown} />
				</span>
				</button>
			</div>
		);
	}
}

Media.propTypes = {
	api: PropTypes.instanceOf(Api).isRequired,
	media: PropTypes.shape({
		day: PropTypes.string.isRequired,
		description: PropTypes.string,
		filename: PropTypes.string.isRequired,
		id: PropTypes.string.isRequired,
		mimeType: PropTypes.string.isRequired,
		month: PropTypes.string.isRequired,
		year: PropTypes.string.isRequired,
	}).isRequired,
	messageType: PropTypes.oneOf([
		MessageTypes.Agent,
		MessageTypes.User,
	]).isRequired,
};

export default Media;
