import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Launcher.module.css";
import {BUTTONLAUNCHER} from "./interfaceTexts";
import LauncherSVG from "./Resources/launcher.svg";

class Launcher extends Component {
	render() {
		const buttonType = "button";

		return (
			<div className={styles.launcher}>
				<button aria-label={BUTTONLAUNCHER} onClick={this.props.handleClick} type={buttonType}>
					<LauncherSVG />
				</button>
			</div>
		);
	}
}

Launcher.propTypes = {handleClick: PropTypes.func};

export default Launcher;
