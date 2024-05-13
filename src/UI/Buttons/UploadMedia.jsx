import React, {Component} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPaperclip} from "@fortawesome/free-solid-svg-icons/faPaperclip";
import PropTypes from "prop-types";
import {SUPPORTED_MEDIA_TYPES} from "../../Api/Constants/SupportedMediaTypes";
import * as styles from "./UploadMedia.module.css";
class UploadMedia extends Component {
	constructor(props) {
		super(props);
		this.fileInputRef = React.createRef();
		this.state = {selectedFile: null};
	}

	handleFileChange = (e) => {
		this.props.onChange(e.target.files[0]);
	}

	render() {
		const typeInput = "file";
		const ariaLabel = "upload";
		const inputId = "upload-file";
		return (
			<>
				<input
					accept={SUPPORTED_MEDIA_TYPES.join(",")}
					id={inputId}
					onChange={this.handleFileChange}
					ref={this.props.fileInputRef}
					style={{display: "none"}}
					type={typeInput}
				/>
				<label
					aria-label={ariaLabel}
					className={styles.paperclip}
					htmlFor={inputId}
					style={{cursor: "pointer"}}
				>
					<FontAwesomeIcon
						icon={faPaperclip}
					/>
				</label>
			</>

		);
	}
}

UploadMedia.propTypes = {
	fileInputRef: PropTypes.func.isRequired,
	onChange: PropTypes.func.isRequired,
};
export default UploadMedia;
