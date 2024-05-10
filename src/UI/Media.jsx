import React, {Component} from "react";
import PropTypes from "prop-types";
import Api from "../Api/Api";
import gfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import * as styles from "./Media.module.css";
import MessageTypes from "../Api/Constants/MessageTypes";
import {isSupportedMediaType} from "../Api/Constants/Other";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFile, faFileAudio, faFilePdf, faFileVideo} from "@fortawesome/free-solid-svg-icons";

class Media extends Component {
	constructor(props) {
		super(props);

		// state
		this.state = {
			fileUrl: null,
			isLoading: true,
			errorText: "_Unable to load media_",
			mediaType: null,
		};
	}


	handleDownload = () => {
		const link = document.createElement("a");
		link.href = this.state.fileUrl;
		link.download = this.props.media.description;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	// ToDo @bouke: Het zou mooier zijn als er een mapping wordt gemaakt op basis van SupportedMediaTypes Volgende toevoegen
	// ToDo @bouke: Audio en video moeten nog een kleur bevatten
	// "application/msword",
	// "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	// "application/vnd.ms-excel",
	// "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	// "application/vnd.ms-powerpoint",
	 convertFileToIcon = () => {
		 if(this.state.mediaType.startsWith("application/pdf")) {
	 		return <FontAwesomeIcon className={styles.iconFilePdf} icon={faFilePdf} />;
	 	} else if(this.state.mediaType.startsWith("text")) {
	 		return <FontAwesomeIcon className={styles.iconFileTxtCsv} icon={faFile} />;
	 	} else if(this.state.mediaType.startsWith("audio")) {
	 		return (
		<FontAwesomeIcon
			icon={faFileAudio}
		/>
	 	);
	 	} else if(this.state.mediaType.startsWith("video")) {
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
	 }

	 componentDidMount() {
	 	// Don't load if this is an unsupported mime type
	 	if(!isSupportedMediaType(this.props.media.mimeType)) {
	 		this.setState(() => ({
	 			errorText: "_Unsupported media_",
	 			isLoading: false,
	 			mediaType: null,
	 		}));
	 		return;
	 	}
		 this.setState(() => ({mediaType: this.props.media.mimeType}));
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
	 			const fileUrl = URL.createObjectURL(mediaBlob);
	 			reader.onloadend = () => {
	 				this.setState(() => ({fileUrl}));
	 			};
	 			reader.readAsArrayBuffer(mediaBlob);
	 		})
	 		.finally(() => {
	 			this.setState(() => ({isLoading: false}));
	 		});
	 }


	 render() {
		 const icon = this.convertFileToIcon();

	 	// Don't load if we have no content (yet)
	 	if(this.state.isLoading) {
	 		return (
		<div className={styles.loadingContainer}>
			<span className={styles.loading} />
		</div>
	 		);
	 	}
	 	return (
		<div>
			{
					this.state.fileUrl
						? <div className={styles.messageBoxMedia}>
							<span>{icon}</span>
							<label>
								{this.props.media.description}
							</label>
							<button
								className={styles.messageBoxMediaDownload}
								data-file-url={this.state.fileUrl}
								onClick={this.handleDownload}
							><span className={styles.wrapperDownloadAltIcon}>
								<svg
									aria-label="download" fill="currentColor" name="download-alt-icon-svg"
									role="img" version="1.1" viewBox="0 0 448 512"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M176 32h96c13.3 0 24 10.7 24 24v200h103.8c21.4 0 32.1 25.8 17 41L241 473c-9.4 9.4-24.6 9.4-34 0L31.3 297c-15.1-15.1-4.4-41 17-41H152V56c0-13.3 10.7-24 24-24z"
									></path>
								</svg>
							</span>
							</button>
						</div>
						: <ReactMarkdown remarkPlugins={[gfm]} skipHtml={true}>
							{this.state.errorText}
						</ReactMarkdown>
				}
		</div>
	 	);
	 }
}

Media.propTypes = {
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

export default Media;
