import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Launcher.module.css";
import LauncherSVG from "./Resources/launcher.svg";
import {InterfaceTextsContext} from "./Scripts/Context";
import {MessengerOpenState} from "./Scripts/MessengerOpenState";

class Launcher extends Component {
	render() {
		const buttonType = "button";
		const buttonId = "launcher";
		const stateClass = this.props.messengerOpenState === MessengerOpenState.open ? styles["state-open"] : styles["state-minimize"];
		const launcherClasses = `${styles.launcher} ${stateClass}`;
		const imgAltText = "icon";

		return (
			<InterfaceTextsContext.Consumer>
				{
					interfaceTexts => (
						<div className={launcherClasses}>
							<button
								aria-label={interfaceTexts.ariaLabelButtonLauncher}
								id={buttonId}
								onClick={this.props.onClick}
								type={buttonType}
							>
								{/* eslint-disable-next-line max-len */}
								{this.props.icon === undefined ? <LauncherSVG /> : <img alt={imgAltText} src={this.props.icon} />}
							</button>
						</div>
					)
				}
			</InterfaceTextsContext.Consumer>
		);
	}
}

Launcher.propTypes = {
	icon: PropTypes.string,
	messengerOpenState: PropTypes.string.isRequired,
	onClick: PropTypes.func,
};

export default Launcher;
