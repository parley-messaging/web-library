import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Launcher.module.css";
import LauncherSVG from "./Resources/launcher.svg";
import {InterfaceTextsContext} from "./Scripts/Context";

class Launcher extends Component {
	render() {
		const buttonType = "button";

		return (
			<InterfaceTextsContext.Consumer>
				{
					interfaceTexts => (
						<div className={styles.launcher}>
							<button
								aria-label={interfaceTexts.buttonLauncher}
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
