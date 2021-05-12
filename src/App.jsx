import React from "react";
import PropTypes from "prop-types";

// Components
import Launcher from "./Launcher";
import Chat from "./Chat";

export default class App extends React.Component {
	constructor(props) {
		super(props);

		// Bind functions
		this.toggleChat = this.toggleChat.bind(this);
		this.toggleMenu = this.toggleMenu.bind(this);

		// State
		this.state = {
			showChat: false,
			showMenu: false,
		};
	}

	toggleChat() {
		this.setState(state => ({showChat: !state.showChat}));
	}

	toggleMenu() {
		this.setState(state => ({
			showChat: !state.showChat,
			showMenu: !state.showMenu,
		}));
	}

	render() {
		const title = "Hallo";
		return (
			<>
				<Launcher handleOnClick={this.toggleChat} />
				{this.state.showChat &&
					<Chat
						allowEmoji={true}
						allowFileUpload={true}
						closeAction={this.toggleMenu}
						menuAction={this.toggleMenu}
						minimizeAction={this.toggleMenu}
						title={title}
						welcomeMessage={title}
					/>}
			</>
		);
	}
}

App.propTypes = {name: PropTypes.string};
