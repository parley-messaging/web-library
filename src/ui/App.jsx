import React from "react";
import PropTypes from "prop-types";
import styles from "./App.module.css";

export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.hello = "Hello";
	}

	render() {
		return (
			<div className={styles.app}>
				{this.hello}
				{" "}
				{this.props.name}
			</div>
		);
	}
}

App.propTypes = {name: PropTypes.string};
