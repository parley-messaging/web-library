import React, {Component} from "react";
import PropTypes from "prop-types";
import * as styles from "./Message.module.css";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import MessageTypes from "../Api/Constants/MessageTypes";
import Api from "../Api/Api";
import MessageButtonTypes from "../Api/Constants/MessageButtonTypes";
import ReplyButton from "./MessageButtons/ReplyButton";
import WebUrlButton from "./MessageButtons/WebUrlButton";
import CallButton from "./MessageButtons/CallButton";
import Media from "./Media";
import Image from "./Image";
import mediaShape from "./shapes/media";
import {InterfaceTextsContext} from "./Scripts/Context";

class Message extends Component {
	showTime = (timestamp) => {
		const toSecondsMultiplier = 1000;
		return new Date(timestamp * toSecondsMultiplier).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
	};

	render() {
		let classNames = styles.messageBubble;
		let messageType = null;
		const linkTarget = "_blank";
		if(this.props.message.typeId === MessageTypes.User) {
			classNames += ` ${styles.user}`;
			messageType = MessageTypes.User;
		} else if(this.props.message.typeId === MessageTypes.Agent) {
			classNames += ` ${styles.agent}`;
			messageType = MessageTypes.Agent;
		} else {
			return null;
		}
		const buttonRenderError = "_Unable to show unsupported button_";
		const groupRole = "group";

		return (
			<InterfaceTextsContext.Consumer>
				{
					interfaceTexts => (
						<div className={classNames}>
							{
								this.props.showAgent
								&& this.props.message.agent
								&& this.props.message.agent.name.length > 0
								&& <div className={styles.name}>
									{this.props.message.agent.name}
								</div>
							}
							<article className={styles.message}>
								{/* Title */}
								{
									this.props.message.title
									&& <h2 aria-label={interfaceTexts.ariaLabelMessageTitle}>
										{this.props.message.title}
									</h2>
								}
								{/* Media */}
								{
									this.props.message.media && (this.props.message.media.mimeType.startsWith("image/")
										? <Image
												api={this.props.api} aria-label={interfaceTexts.ariaLabelMessageMedia}
												media={this.props.message.media} messageType={messageType}
										  />
										: <Media
												api={this.props.api} aria-label={interfaceTexts.ariaLabelMessageMedia}
												media={this.props.message.media} messageType={messageType}
										  />)
								}
								{/* Body */}
								<ReactMarkdown
									components={
									{
										p(props) {
											// eslint-disable-next-line no-unused-vars,react/prop-types
											const {node, ...rest} = props;
											return <p aria-label={interfaceTexts.ariaLabelMessageBody} {...rest} />;
										},
									}
									}
									linkTarget={linkTarget}
									remarkPlugins={[gfm]}
									skipHtml={true}
								>
									{this.props.message.message}
								</ReactMarkdown>
								{/* Buttons */}
								{
									this.props.message.buttons
									&& <div aria-label={interfaceTexts.ariaLabelMessageButtons} role={groupRole}>
										{
											this.props.message.buttons.map((button, index) => {
												switch (button.type) {
												case MessageButtonTypes.Reply:
													return (
														<ReplyButton
															// eslint-disable-next-line max-len,react/no-array-index-key
															api={this.props.api} key={index} payload={button.payload}
															title={button.title}
														/>
													);
												case MessageButtonTypes.WebUrl:
													return (
														<WebUrlButton
															// eslint-disable-next-line max-len,react/no-array-index-key
															key={index} payload={button.payload}
															title={button.title}
														/>
													);
												case MessageButtonTypes.PhoneNumber:
													return (
														<CallButton
															// eslint-disable-next-line max-len,react/no-array-index-key
															key={index} payload={button.payload}
															title={button.title}
														/>
);
												default:
													return <ReactMarkdown>{buttonRenderError}</ReactMarkdown>;
												}
											})
										}
									</div>
								}
								<span className={styles.time}>
									{this.showTime(this.props.message.time)}
								</span>
							</article>
						</div>
					)
				}
			</InterfaceTextsContext.Consumer>
		);
	}
}

Message.propTypes = {
	api: PropTypes.instanceOf(Api),
	message: PropTypes.shape({
		agent: PropTypes.shape({
			avatar: PropTypes.string,
			id: PropTypes.number,
			name: PropTypes.string.isRequired,
		}),
		buttons: PropTypes.arrayOf(PropTypes.shape({
			payload: PropTypes.string.isRequired,
			title: PropTypes.string,
			type: PropTypes.oneOf(Object.values(MessageButtonTypes)),
		})),
		id: PropTypes.number,
		media: PropTypes.shape(mediaShape),
		message: PropTypes.string,
		quickReplies: PropTypes.arrayOf(PropTypes.string),
		time: PropTypes.number.isRequired,
		title: PropTypes.string,
		typeId: PropTypes.number.isRequired,
	}),
	showAgent: PropTypes.bool,
};

export default Message;
