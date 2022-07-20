import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Header.module.css";

import HeaderButton, {menuType, minimizeType} from "./Buttons/HeaderButton";

class Header extends Component {
	render() {
		return (
			<div className={styles.header}>
				<div className={styles.left}>
					 <HeaderButton
						onClick={this.props.onMenuClick}
						type={menuType}
					 />
				</div>
				<span className={styles.title}>{this.props.title}</span>
				<div className={styles.right}>
					<HeaderButton
						onClick={this.props.onMinimizeClick}
						type={minimizeType}
					/>
					{/* <HeaderButton*/}
					{/*	onClick={this.props.onCloseClick}*/}
					{/*	type={closeType}*/}
					{/* />*/}
				</div>
			</div>
		);
	}
}

Header.propTypes = {
	onCloseClick: PropTypes.func,
	onMenuClick: PropTypes.func,
	onMinimizeClick: PropTypes.func,
	title: PropTypes.string,
};

export default Header;
