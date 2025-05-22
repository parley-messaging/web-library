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
		let launcherClasses = `${styles.launcher} ${stateClass}`;
		const imgAltText = "icon";

		// Add animation class when there are new unread messages
		if(this.props.amountOfUnreadMessages > 0)
			launcherClasses += ` ${styles.shake}`;

		return (
			<InterfaceTextsContext.Consumer>
				{
					interfaceTexts => (

						// Key is added on purpose here to always re-render the <div>
						// when the amountOfUnreadMessages changes. Otherwise the animation
						// only plays the first time this class is set, because react only updates
						// the <div> around amountOfUnreadMessages
						<div className={launcherClasses} key={this.props.amountOfUnreadMessages}>
							<button
								aria-label={interfaceTexts.ariaLabelButtonLauncher}
								id={buttonId}
								onClick={this.props.onClick}
								tabIndex={0}
								type={buttonType}
							>
								{/* eslint-disable-next-line max-len */}
								{
									this.props.icon === undefined
										? <LauncherSVG />
										: <img alt={imgAltText} src={this.props.icon} />
								}
							</button>
							{
								this.props.amountOfUnreadMessages > 0
								&& <div className={styles.unreadMessagesBadge}>
									{this.props.amountOfUnreadMessages}
								</div>
							}
						</div>
					)
				}
			</InterfaceTextsContext.Consumer>
		);
	}
}

Launcher.propTypes = {
	amountOfUnreadMessages: PropTypes.number,
	icon: PropTypes.string,
	messengerOpenState: PropTypes.string.isRequired,
	onClick: PropTypes.func,
};

export default Launcher;
