import React, {Component} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPaperclip} from "@fortawesome/free-solid-svg-icons/faPaperclip";
import PropTypes from "prop-types";
import {SUPPORTED_MEDIA_TYPES} from "../../Api/Constants/SupportedMediaTypes";
import * as styles from "./UploadMedia.module.css";
class UploadMedia extends Component {
	handleFileChange = (e) => {
		this.props.onChange(e.target.files[0]);
	}

	render() {
		const typeInput = "file";
		const ariaLabel = "upload";
		const inputId = "upload-file";
		let allowedMediaTypes = SUPPORTED_MEDIA_TYPES;
		if(this.props.allowedMediaTypes?.length > 0)
			({allowedMediaTypes} = this.props);

		return (
			<>
				<input
					accept={allowedMediaTypes.join(",")}
					id={inputId}
					onChange={this.handleFileChange}
					style={{display: "none"}}
					type={typeInput}
				/>
				<label
					aria-label={ariaLabel}
					className={styles.uploadLabel}
					htmlFor={inputId}
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
	allowedMediaTypes: PropTypes.arrayOf(PropTypes.oneOf(SUPPORTED_MEDIA_TYPES)),
	onChange: PropTypes.func.isRequired,
};
export default UploadMedia;
