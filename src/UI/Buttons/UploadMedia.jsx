import React, {Component} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPaperclip} from "@fortawesome/free-solid-svg-icons/faPaperclip";
import PropTypes from "prop-types";
import {SUPPORTED_MEDIA_TYPES} from "../../Api/Constants/SupportedMediaTypes";

class UploadMedia extends Component {
	constructor(props) {
		super(props);
		this.fileInputRef = React.createRef();
		this.state = {selectedFile: null};
	}

	handleFileChange = (event) => {
		const file = event.target.files[0];
		this.setState({selectedFile: file});
		this.props.onFileSelect(file);
	};

	handleClick = () => {
		if(this.fileInputRef.current)
			this.fileInputRef.current.click();
	};

	render() {
		const typeInput = "file";
		const ariaLabel = "upload";
		const htmlForType = "fileInput";
		return (
			<>
				<input
					accept={SUPPORTED_MEDIA_TYPES.join(",")}
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
			</>

		);
	}
}

UploadMedia.propTypes = {onFileSelect: PropTypes.func.isRequired};
export default UploadMedia;
