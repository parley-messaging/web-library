import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./Header.module.css";

import HeaderButton, {minimizeType} from "./Buttons/HeaderButton";

class Header extends Component {
	render() {
		return (
			<div className={styles.header}>
				<div className={styles.left}>
					{/* <HeaderButton*/}
					{/*	onClick={this.props.handleMenuClick}*/}
					{/*	type={menuType}*/}
					{/* />*/}
				</div>
				<span className={styles.title}>{this.props.title}</span>
				<div className={styles.right}>
					<HeaderButton
						onClick={this.props.handleMinimizeClick}
						type={minimizeType}
					/>
					{/* <HeaderButton*/}
					{/*	onClick={this.props.handleCloseClick}*/}
					{/*	type={closeType}*/}
					{/* />*/}
				</div>
			</div>
		);
	}
}

Header.propTypes = {
	handleCloseClick: PropTypes.func,
	handleMenuClick: PropTypes.func,
	handleMinimizeClick: PropTypes.func,
	title: PropTypes.string,
};

export default Header;
