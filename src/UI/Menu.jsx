import React, {Component} from "react";
import PropTypes from "prop-types";
import Api from "../Api/Api";
import MenuOption, {closeIcon, downloadIcon} from "./MenuOption";
import {saveAs} from "file-saver";
import {InterfaceTextsContext} from "./Scripts/Context";
import * as styles from "./Menu.module.css";

class Menu extends Component {
	static contextType = InterfaceTextsContext;

	constructor(props) {
		super(props);

		this.textArea = React.createRef();
	}

	handleDownloadClick = () => {
		this.props.api.getTranscript().then((transcript) => {
			const file = new File(transcript, this.context.downloadTranscript, {type: "text/plain"});

			saveAs(file);
		});
	}

	render() {
		return (
			<div className={styles.menu}>
				<div className={styles.navigation}>
					<MenuOption
						icon={closeIcon}
						onClick={this.props.onClose}
						text={this.context.ariaLabelButtonMenuClose}
					/>
				</div>
				<div className={styles.content}>
					<MenuOption
						icon={downloadIcon}
						onClick={this.handleDownloadClick}
						text={this.context.downloadTranscript}
					/>
					{/* <MenuOption*/}
					{/*	icon={infoIcon}*/}
					{/*	onClick={this.handleAbout}*/}
					{/*	text={this.context.aboutApp}*/}
					{/* />*/}
				</div>
			</div>
		);
	}
}

Menu.propTypes = {
	api: PropTypes.instanceOf(Api).isRequired,
	onClose: PropTypes.func.isRequired,
};

export default Menu;
