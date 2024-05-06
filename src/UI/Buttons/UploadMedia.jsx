import React, {Component} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPaperclip} from "@fortawesome/free-solid-svg-icons/faPaperclip";
import PropTypes from "prop-types";
const SUPPORTED_MEDIA_TYPES = {
	images:
	[
		"image/jpeg",
		"image/png",
		"image/gif",
	],
	files:
	[
		"application/pdf",
		"text/plain",
		"text/csv",
		"text/comma-separated-values",
		"application/csv",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-powerpoint",
	],
	media:
	[
		"video/*", "audio/*",
	],
};
class UploadMedia extends Component {
	// experiment
	constructor(props) {
		super(props);
		this.fileInputRef = React.createRef();
		this.state = {selectedFile: null};
	}

	handleFileChange = (event) => {
		const file = event.target.files[0];
		this.setState({selectedFile: file});
		this.props.onFileSelect(file); // Call the callback function with the selected file
	};

	handleClick = () => {
		if(this.fileInputRef.current)
			this.fileInputRef.current.click();
	};

	mimeTypes = Object.values(SUPPORTED_MEDIA_TYPES)
		.reduce((acc, group) => acc.concat(group), [])
		.join(",");

	render() {
		const typeInput = "file";
		const ariaLabel = "upload";
		const htmlForType = "fileInput";
		const {selectedFile} = this.state;

		return (
			<>
				<input
					accept={this.mimeTypes}
					onChange={this.handleFileChange}
					ref={this.fileInputRef}
					style={{display: "none"}}
					type={typeInput}
				/>
				<label
					aria-label={ariaLabel}
					htmlFor={htmlForType}
					onClick={this.handleClick}
					style={{cursor: "pointer"}}
				>
					<FontAwesomeIcon icon={faPaperclip} />
				</label>
				// ToDo @bouke: Gebruikt voor het testen tijdelijk
				{selectedFile && <p>{selectedFile.name}</p>}
			</>

		);
	}
}

UploadMedia.propTypes = {onFileSelect: PropTypes.func.isRequired};
export default UploadMedia;
