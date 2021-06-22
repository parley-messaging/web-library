import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Header.module.css";

// TODO: supress until https://github.com/parley-messaging/web-library/pull/3#discussion_r656174570 is resolved
// eslint-disable-next-line no-unused-vars
import HeaderButton, {menuType, minimizeType, closeType} from "./Buttons/HeaderButton";

class Header extends Component {
	render() {
		return (
			<div className={styles.header}>
				<div className={styles.left}>
					{/* <HeaderButton*/}
					{/*	handleOnClick={this.props.menuAction}*/}
					{/*	type={menuType}*/}
					{/* />*/}
				</div>
				<span className={styles.title}>{this.props.title}</span>
				<div className={styles.right}>
					<HeaderButton
						handleOnClick={this.props.minimizeAction}
						type={minimizeType}
					/>
					{/* <HeaderButton*/}
					{/*	handleOnClick={this.props.closeAction}*/}
					{/*	type={closeType}*/}
					{/* />*/}
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
