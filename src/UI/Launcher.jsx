import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Launcher.module.css";
import LauncherSVG from "./Resources/launcher.svg";
import {InterfaceTextsContext} from "./Scripts/Context";

class Launcher extends Component {
	static propTypes = {messengerOpenState: PropTypes.string}
	render() {
		const buttonType = "button";
		const buttonId = "launcher";
		const launcherClass = `${styles.launcher} state-${this.props.messengerOpenState}`;

		return (
			<InterfaceTextsContext.Consumer>
				{
					interfaceTexts => (
						<div className={launcherClass}>
							<button
								aria-label={interfaceTexts.ariaLabelButtonLauncher}
								id={buttonId}
								onClick={this.props.onClick}
								type={buttonType}
							>
								<LauncherSVG />
							</button>
						</div>
					)
				}
			</InterfaceTextsContext.Consumer>
		);
	}
}

Launcher.propTypes = {onClick: PropTypes.func};

export default Launcher;
