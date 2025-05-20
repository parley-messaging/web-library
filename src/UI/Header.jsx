import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Header.module.css";

import HeaderButton, {minimizeType} from "./Buttons/HeaderButton";
import {TAB_INDEX_3} from "./Scripts/TabIndexes";

export const headerId = "header";

class Header extends Component {
	render() {
		return (
			<div className={styles.header}>
				<div className={styles.left}>
					{/* <HeaderButton*/}
					{/*	onClick={this.props.onMenuClick}*/}
					{/*	type={menuType}*/}
					{/* />*/}
				</div>
				<h1 className={styles.title} id={headerId}>{this.props.title}</h1>
				<div className={styles.right}>
					<HeaderButton
						onClick={this.props.onMinimizeClick}
						tabIndex={TAB_INDEX_3}
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
