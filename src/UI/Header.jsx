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
					{/*	onClick={this.props.menuAction}*/}
					{/*	type={menuType}*/}
					{/* />*/}
				</div>
				<span className={styles.title}>{this.props.title}</span>
				<div className={styles.right}>
					<HeaderButton
						handleClick={this.props.minimizeAction}
						type={minimizeType}
					/>
					{/* <HeaderButton*/}
					{/*	onClick={this.props.closeAction}*/}
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
