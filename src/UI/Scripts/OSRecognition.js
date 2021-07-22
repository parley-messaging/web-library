/**
 * Checks if the current browser is a Mobile browser.
 *
 * @return {boolean}
 */
export function isMobile() {
	// Check if the primary pointer device's accuracy
	// it that of a touch device.
	const isTouch = window.matchMedia("(pointer: coarse)").matches;

	// TODO:
	//  Normally we would also match `(hover: none),(hover: on-demand)`
	//  to determine if the primary pointer device
	//  has no (or limited) hover capabilities
	//  But somehow on browserstack.com the hover capability
	//  exists `(hover: hover)` ...

	return isTouch;
}

/**
 * Checks if the current UserAgent is a Mobile iOS device
 *
 * @return {boolean}
 */
export function isiOSMobileDevice() {
	return (/iPhone|iPad|iPod/u).test(navigator.userAgent);
}
