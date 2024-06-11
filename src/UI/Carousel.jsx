import React, {Component} from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import * as styles from "./Carousel.module.less";
import {isMobile} from "./Scripts/OSRecognition";


export default class Carousel extends Component {
	constructor(props) {
		super(props);

		this.carouselRef = React.createRef();
		this.previousButtonName = "previous";
		this.nextButtonName = "next";
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

	render() {
		let previousButtonStyle = `${styles.navButton} ${styles.previous}`;
		let nextButtonStyle = `${styles.navButton} ${styles.next}`;
		const previousButtonText = "<";
		const nextButtonText = ">";
		if(isMobile()) {
			previousButtonStyle += ` ${styles.isMobile}`;
			nextButtonStyle += ` ${styles.isMobile}`;
		}

		return (
			<div className={styles.carouselContainer}>
				<div className={styles.carousel} ref={this.carouselRef}>
					{
						this.props.items.map((item, index) => (
							// eslint-disable-next-line react/no-array-index-key
							<div className={styles.carouselItem} key={index}>
								{item}
							</div>
					))
					}
				</div>
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
			</div>
		);
	}
}

// Carousel.propTypes = {items: PropTypes.arrayOf(PropTypes.instanceOf(Message))};
