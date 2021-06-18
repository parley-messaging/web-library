import React from "react";
import PropTypes from "prop-types";

// Components
import Launcher from "./Launcher";
import Chat from "./Chat";

export default class App extends React.Component {
	constructor(props) {
		super(props);

		// State
		this.state = {
			showChat: false,
			showMenu: false,
		};
	}

	toggleChat = () => {
		// eslint-disable-next-line no-invalid-this
		this.setState(state => ({showChat: !state.showChat}));
	}

	toggleMenu = () => {
		// eslint-disable-next-line no-invalid-this
		this.setState(state => ({
			showChat: !state.showChat,
			showMenu: !state.showMenu,
		}));
	}

	render() {
		const title = "Default Chat - EN";
		const welcomeMessage = "Welcome to our support chat, you can expect a response in ~1 minute.";

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
						welcomeMessage={welcomeMessage}
					/>}
			</>
		);
	}
}

App.propTypes = {name: PropTypes.string};
