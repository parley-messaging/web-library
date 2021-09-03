import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Launcher.module.css";
import {BUTTONLAUNCHER} from "./tempConfig";
import LauncherSVG from "./Resources/launcher.svg";

class Launcher extends Component {
	render() {
		const buttonType = "button";

		return (
			<div className={styles.launcher}>
				<button aria-label={BUTTONLAUNCHER} onClick={this.props.onClick} type={buttonType}>
					<LauncherSVG />
				</button>
			</div>
		);
	}
}

Launcher.propTypes = {onClick: PropTypes.func};

export default Launcher;
