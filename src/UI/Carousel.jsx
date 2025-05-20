import React, {Component} from "react";
import * as styles from "./Carousel.module.less";
import {isMobile} from "./Scripts/OSRecognition";
import PropTypes from "prop-types";


export default class Carousel extends Component {
	constructor(props) {
		super(props);

		this.carouselRef = React.createRef();
		this.previousButtonName = "previous";
		this.nextButtonName = "next";

		this.state = {shouldRenderNavigation: true};
	}

	handleNavigationClick = (e) => {
		const {scrollWidth} = this.carouselRef.current;
		const messagePaddingLeftCorrection = 30; // Amount in px of the left padding for messages
		// This correction fixes the issue where subsequent carousel items
		// don't start in the same topLeft spot as the previous item.
		// They either become outside the chat screen (too far left)
		// or to far right.

		if(e.target.name === this.nextButtonName) {
			this.carouselRef.current.scrollLeft
				+= (scrollWidth / this.props.items.length) - messagePaddingLeftCorrection;
		} else if(e.target.name === this.previousButtonName) {
			this.carouselRef.current.scrollLeft
				-= (scrollWidth / this.props.items.length) + messagePaddingLeftCorrection;
		}
	};

	componentDidMount = () => {
		// We always render the navigation by default
		// unless the navigation isn't needed because all the carousel items already fit on the screen
		// (on fullscreen for example, with a couple carousel items)

		if(this.props.items.length === 1 // Single items should never show navigation
			|| this.carouselRef.current?.clientWidth === this.carouselRef.current?.scrollWidth
		) {
			// There is nothing to scroll so hide the navigation
			this.setState(prevState => ({
				...prevState,
				shouldRenderNavigation: false,
			}));
		}
	};

	render() {
		let previousButtonStyle = `${styles.navButton} ${styles.previous}`;
		let nextButtonStyle = `${styles.navButton} ${styles.next}`;
		if(isMobile()) {
			previousButtonStyle += ` ${styles.isMobile}`;
			nextButtonStyle += ` ${styles.isMobile}`;
		}

		const previousButtonText = "<";
		const nextButtonText = ">";
		const feedRole = "feed";

		return (
			<div className={styles.carouselContainer}>
				<div className={styles.carousel} ref={this.carouselRef} role={feedRole} tabIndex={0}>
					{
						this.props.items.map((item, index) => (
							// eslint-disable-next-line react/no-array-index-key
							<div className={styles.carouselItem} key={index}>
								{item}
							</div>
						))
					}
				</div>
				{
					this.state.shouldRenderNavigation && <>
						<button
							className={previousButtonStyle} name={this.previousButtonName}
							onClick={this.handleNavigationClick}
						>
							{previousButtonText}
						</button>
						<button
							className={nextButtonStyle} name={this.nextButtonName}
							onClick={this.handleNavigationClick}
						>
							{nextButtonText}
						</button>
					</>
				}
			</div>
		);
	}
}

Carousel.propTypes = {items: PropTypes.arrayOf(PropTypes.node)};
