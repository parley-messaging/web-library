import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Header.module.css";

// components
import HeaderButton from "./Buttons/HeaderButton";

class Header extends Component {
	render() {
		const iconMenu = "menu";
		const iconMinimize = "minimize";
		const iconClose = "close";

		return (
			<div className={styles.header}>
				<HeaderButton
					className={styles.headerButton}
					handleOnClick={this.props.menuAction}
					icon={iconMenu}
				/>
				<span>{this.props.title}</span>
				<span>
					<HeaderButton
						className={styles.headerButton}
						handleOnClick={this.props.minimizeAction}
						icon={iconMinimize}
					/>
					<HeaderButton
						className={styles.headerButton}
						handleOnClick={this.props.closeAction}
						icon={iconClose}
					/>
				</span>
			</div>
		);
	}
}

Header.propTypes = {
	closeAction: PropTypes.func,
	menuAction: PropTypes.func,
	minimizeAction: PropTypes.func,
	title: PropTypes.string,
};

export default Header;
