import React, {Component} from "react";
import PropTypes from "prop-types";
import {SUPPORTED_MEDIA_TYPES} from "../../Api/Constants/SupportedMediaTypes";
import {InterfaceTextsContext} from "../Scripts/Context";
import {Button, FileTrigger} from "react-aria-components";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPaperclip} from "@fortawesome/free-solid-svg-icons";
import * as styles from "./UploadMedia.module.css";

class UploadMedia extends Component {
	static contextType = InterfaceTextsContext;

	handleFileChange = (files) => {
		this.props.onChange(files[0]);
	};

	render() {
		const ariaLabel = this.context.ariaLabelUploadFile;
		const inputId = "upload-file";
		let allowedMediaTypes = SUPPORTED_MEDIA_TYPES;
		if(this.props.allowedMediaTypes?.length > 0)
			({allowedMediaTypes} = this.props);


		return (
			<FileTrigger
				acceptedFileTypes={allowedMediaTypes}
				id={inputId}
				onSelect={this.handleFileChange}
			>
				<Button
					aria-label={ariaLabel}
					className={styles.uploadButton}
				>
					<FontAwesomeIcon
						icon={faPaperclip}
					/>
				</Button>
			</FileTrigger>
		);
	}
}

UploadMedia.propTypes = {
	allowedMediaTypes: PropTypes.arrayOf(PropTypes.oneOf(SUPPORTED_MEDIA_TYPES)),
	onChange: PropTypes.func.isRequired,
};
export default UploadMedia;
