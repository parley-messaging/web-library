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
				<div className={styles.left}>
					{/* <HeaderButton
						handleOnClick={this.props.menuAction}
						icon={iconMenu}
					/>*/}
				</div>
				<span className={styles.title}>{this.props.title}</span>
				<div className={styles.right}>
					<HeaderButton
						handleOnClick={this.props.minimizeAction}
						icon={iconMinimize}
					/>
					{/* <HeaderButton
						handleOnClick={this.props.closeAction}
						icon={iconClose}
					/>*/}
				</div>
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
