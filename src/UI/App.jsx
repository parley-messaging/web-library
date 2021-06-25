import React from "react";
import PropTypes from "prop-types";

// Components
import Launcher from "./Launcher";
import Chat from "./Chat";

export default class App extends React.Component {
	constructor(props) {
		super(props);

		// State
		this.state = {showChat: false};
	}

	handleClick = () => {
		this.toggleChat();
	}

	toggleChat = () => {
		this.setState(state => ({showChat: !state.showChat}));
	}

	render() {
		const title = "Default Chat - EN";
		const welcomeMessage = "Welcome to our support chat, you can expect a response in ~1 minute.";

		return (
			<>
				<Launcher onClick={this.handleClick} />
				{
					this.state.showChat
					&& <Chat
						allowEmoji={true}
						allowFileUpload={true}
						onMinimizeClick={this.handleClick}
						title={title}
						welcomeMessage={welcomeMessage}
					   />
				}
			</>
		);
	}
}

App.propTypes = {name: PropTypes.string};
